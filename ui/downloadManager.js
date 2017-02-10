/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: nil -*- */

const Lang = imports.lang;
const Signals = imports.signals;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Soup = imports.gi.Soup;
const GObject = imports.gi.GObject;

function recursivelyDeleteDir(dir) {
    let children = dir.enumerate_children('standard::name,standard::type',
                                          Gio.FileQueryInfoFlags.NONE, null);
    let info, child;
    while ((info = children.next_file(null)) != null) {
        let type = info.get_file_type();
        let child = dir.get_child(info.get_name());
        if (type == Gio.FileType.REGULAR)
            child['delete'](null);
        else if (type == Gio.FileType.DIRECTORY)
            recursivelyDeleteDir(child);
    }
    dir['delete'](null);
}

const DownloaderManager = new GObject.Class({
    Name: 'Gnocine.DownloaderManager',
    GTypeName: 'GnocineDownloaderManager',

    _init: function(maxThreads) {
        this._downloadStarted = false;
        this._downloadFinished = false;
        this._currentThreads = 0;
        this._numberOfJobs = 0;
        this._maxThreads = maxThreads;
        this.jobs = new Array();
        this.httpSession = new Soup.SessionAsync({ ssl_use_system_ca_file: true });
        // See: https://bugzilla.gnome.org/show_bug.cgi?id=655189 for context.
        // this.httpSession.add_feature(new Soup.ProxyResolverDefault());
        Soup.Session.prototype.add_feature.call(this.httpSession, new Soup.ProxyResolverDefault());
    },

    addJob: function(job) {
        if(!this._download_started) {
            job.setSoupSession(this.httpSession);
            let headerId = job.connect("download-header", Lang.bind(this, this._onDownloadHeader));
            let hookId = job.connect("download-hook", Lang.bind(this, this._onDownloadHook));
            let doneId = job.connect("download-done", Lang.bind(this, this._onDownloadDone));
            let errorId = job.connect("download-error", Lang.bind(this, this._onDownloadError));
            let sucefullyId = job.connect("download-sucefully", Lang.bind(this, this._onDownloadSucefully));
            this.jobs.push({
                job: job, headerId: headerId, hookId: hookId, doneId: doneId,
                errorId: errorId, sucefullyId: sucefullyId
            });
            this._numberOfJobs++;
        } else { //We really can add it, but will break our stadisticals.
            throw Error("Can not be added jobs when there are download tasks in progress");
        }
    },

    stopAll: function() {
        if(!this._download_started && !this._downloadFinished) {
            for(let pos in this.jobs) {
                let metadata = this.jobs[pos];
                if(metadata && metadata.job.currMessage) {
                    this.httpSession.cancel_message(metadata.job.currMessage, Soup.Status.CANCELLED);
                    metadata.job.emit("download-error", Soup.Status.CANCELLED);
                    metadata.job.emit("download-done");
                }
            }
        }
    },

    clearAll: function() {
        if(!this._downloadStarted || this._downloadFinished) {
            this._downloadStarted = false;
            this._downloadFinished = false;
            this._currentThreads = 0;
            this._numberOfJobs = 0;
            for(let pos in this.jobs) {
               let metadata = this.jobs[pos];
               metadata.job.disconnect(metadata.headerId);
               metadata.job.disconnect(metadata.hookId);
               metadata.job.disconnect(metadata.doneId);
               metadata.job.disconnect(metadata.errorId);
               metadata.job.disconnect(metadata.sucefullyId);
            }
            this.jobs = new Array();
        }
    },

    getMaxThreads: function() {
        return this._maxThreads;
    },

    getNecessaryNumberOfThreads: function() {
        return Math.min(this.jobs.length, this._maxThreads);
    },

    getActiveNumberOfThreads: function() {
        return this._currentThreads;
    },

    getNumberOfJobs: function() {
        return this._numberOfJobs;
    },

    isFinished: function() {
        return this._downloadFinished;
    },

    startDownloads: function() {
        if(!this._downloadStarted && !this._downloadFinished) {
            this._downloadStarted = true;
            this._currentThreads = 0;
            this._numberOfJobs = this.jobs.length;
            let threads = this.getNecessaryNumberOfThreads();
            for(let i = 0; i < threads; i++) {
                this.jobs[i].job.start();
                this._currentThreads++;
            }
            return true;
        }
        return false;
    },

    _onDownloadHeader: function(job, contentType, downloadLength) {
        this.emit("download-header", job, contentType, downloadLength);
    },

    _onDownloadHook: function(job, downloadSize, downloadLength) {
        this.emit("download-hook", job, downloadSize, downloadLength);
    },

    _onDownloadError: function(job, statusCode) {
        this.emit("download-error", job, statusCode);
    },

    _onDownloadSucefully: function(job) {
        this.emit("download-sucefully", job);
    },

    _onDownloadDone: function(job) {
        this.emit("download-done", job, this._currentThreads + 1,  this.jobs.length);
        if(this._currentThreads < this.jobs.length) {
            this.jobs[this._currentThreads].job.start();
            this._currentThreads++;
        } else {
            this._downloadStarted = false;
            this._downloadFinished = true;
            this.emit("download-finished");
        }
    },
});
Signals.addSignalMethods(DownloaderManager.prototype);

const DownloadJob = new GObject.Class({
    Name: 'Gnocine.DownloadJob',
    GTypeName: 'GnocineDownloadJob',

    _init: function(sourceURL, destinationFile) { //notify_callback=null
        this.sourceURL = sourceURL;
        this.destinationFile = destinationFile;
        this.downloadLength = null;
        this.downloadSize = 0;
        this.httpSession = null;
        this.currMessage = null;
    },

    setSoupSession: function(httpSession) {
        this.httpSession = httpSession;
    },

    isComplete: function() {
        return this.destinationFile;
    },

    getDownloadLength: function() {
        return this.downloadLength;
    },

    getDownloadSize: function() {
        return this.downloadSize;
    },

    start: function() {
        if(this.httpSession) {
            this.downloadSize = 0;
            this.downloadLength = null;
            // Create the parent directory if not exist
            if (!this.destinationFile.get_parent().query_exists(null))
                this.destinationFile.get_parent().make_directory_with_parents(null);
            // Our params
            let params = { uuid: "daemon", shell_version: "3.0"};
            // create an http message
            this.currMessage = Soup.form_request_new_from_hash('GET', this.sourceURL, params);
            // queue the http request
            this.httpSession.queue_message(this.currMessage, Lang.bind(this, this._onQueueMessage));
            // got_headers event
            this.currMessage.connect('got_headers', Lang.bind(this, this._onReportHeader));
            // got_chunk event
            this.currMessage.connect('got_chunk', Lang.bind(this, this._onReportHook));
        }
    },

    _onReportHeader: function(message, chunk) {
        // FIXME: We are discarting here one report of header.
        // Aparently, the server response if is available first.
        // We have a better way to discart this, will work in all context?
        let [contentType, params] = message.response_headers.get_content_type();
        if(contentType != "text/html") {
            this.downloadLength = message.response_headers.get_content_length();
            this.emit("download-header", contentType, this.downloadLength);
        }
    },

    _onReportHook: function(message, chunk) {
        if(this.downloadLength) {
            this.downloadSize += chunk.length;
            this.emit("download-hook", this.downloadSize, this.downloadLength);
        }
    },

    _onQueueMessage: function(httpSession, message) {
        if (message.status_code != Soup.KnownStatusCode.OK) {
            this.emit("download-error", message.status_code);
            this.emit("download-done");
            return;
        }
        let contents = message.response_body.flatten().get_as_bytes();
        if(contents && (contents.get_size() > 0)) {
            let raw = this.destinationFile.replace(null, false, Gio.FileCreateFlags.NONE, null);
            raw.write_bytes(contents, null);
            raw.close(null);
            this.emit("download-sucefully");
            this.emit("download-done");
        } else {
            this.emit("download-error", Soup.Status.IO_ERROR);
            this.emit("download-done");
        }
        this.currMessage = null;
    },
});
Signals.addSignalMethods(DownloadJob.prototype);
