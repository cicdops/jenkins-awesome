#!/bin/bash

set -e

UPDATES_URL="http://updates.jenkins-ci.org/download/plugins/"

if [ $# -lt 2 ]; then
  echo "USAGE: $0 plugin-list-file destination-directory"
  exit 1
fi

plugin_list=$1
plugin_dir=$2

#file_owner=jenkins.jenkins

mkdir -p $plugin_dir

installPlugin() {
  if [ -f ${plugin_dir}/${1}.hpi -o -f ${plugin_dir}/${1}.jpi ]; then
    if [ "$2" == "1" ]; then
      return 1
    fi
    echo "Skipped: $1 (already installed)"
    return 0
  else
    echo "Installing: $1"
    curl -L --silent --output ${plugin_dir}/${1}.hpi  ${UPDATES_URL}/${1}/${2}/${1}.hpi
    return 0
  fi
}

while IFS="|" read plugin version
do
    #escape comments
    if [[ $plugin =~ ^# ]]; then
       continue
    fi

    #install the plugin
    installPlugin $plugin $version
done < $plugin_list


changed=1
maxloops=100

while [ "$changed"  == "1" ]; do
  echo "Check for missing dependecies ..."
  if  [ $maxloops -lt 1 ] ; then
    echo "Max loop count reached - probably a bug in this script: $0"
    exit 1
  fi
  ((maxloops--))
  changed=0
  for f in ${plugin_dir}/*.hpi ; do
    # get a list of only non-optional dependencies
    deps=$( unzip -p ${f} META-INF/MANIFEST.MF|tr -d '\r' | sed -e ':a;N;$!ba;s/\n //g' | grep -e 'Plugin-Dependencies' | awk '{print $2}' | tr "," "\n" | grep -v 'resolution:=optional')
    
    #if deps were found, install them .. then set changed, so we re-loop all over all xpi's 
    if [[ ! -z $deps ]]; then
       echo $deps | tr ' ' '\n' | 
       while IFS=: read plugin version; do
          installPlugin $plugin $version
       done
       changed=1
    fi
  done
done

#echo "fixing permissions"

#chown ${file_owner} ${plugin_dir} -R

echo "all done"
