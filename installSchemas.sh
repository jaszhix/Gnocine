#!/bin/bash

for schema in ./schemas/org.cinnamon*
do
  sudo cp -avrf $schema /usr/share/glib-2.0/schemas
done
sudo rm /usr/share/glib-2.0/schemas/org.cinnamon.desktop.enums.xml
sudo glib-compile-schemas /usr/share/glib-2.0/schemas/