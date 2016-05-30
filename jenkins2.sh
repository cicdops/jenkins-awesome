#!/bin/bash

scriptdir=`dirname "$BASH_SOURCE"`
echo $scriptdir
export JENKINS_ROOT=$scriptdir
export JENKINS_HOME=$JENKINS_ROOT/jenkins2_home
java -jar $JENKINS_ROOT/jenkins2.7.war --httpPort=8008
