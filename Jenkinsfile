pipeline {
    agent {
      kubernetes {
        //cloud 'kubernetes'
        defaultContainer 'node'
        yaml """
  kind: Pod
  spec:
    containers:
    - name: node
      image: node:15.7.0
      command:
      - cat
      tty: true
    - name: kaniko
      image: gcr.io/kaniko-project/executor:1.5.0-debug
      command:
        - /busybox/cat
      tty: true
      securityContext:
        allowPrivilegeEscalation: false
  """
      }
    }
    environment {
        CI = 'true'
        DISCORD_WEBHOOK_URL = credentials('discord_webhook_url')
    }
    options {
        ansiColor('xterm')
        timestamps()
    }
    stages {
        stage('Prepare') {
            steps {
              sh 'yarn install'
              sh 'yarn lint'
            }
        }
        stage('Test') {
            steps {
                sh 'yarn ci:test'
            }
        }
        stage('Build') {
          steps {
            sh 'yarn build --production'
          }
        }
    }
}
