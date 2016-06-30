#!/bin/bash

scriptdir=`dirname "$BASH_SOURCE"`
export JENKINS_ROOT=$scriptdir
export JENKINS_HOME=$JENKINS_ROOT/jenkins_home
echo JENKINS_HOME:$JENKINS_HOME 
java -Dorg.apache.commons.jelly.tags.fmt.timeZone=Asia/Shanghai -jar $JENKINS_ROOT/jenkins.war --httpPort=8008
