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
      image: gcr.io/kaniko-project/executor:v1.5.0-debug
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
        GITHUB_TOKEN = credentials('ns212-github-token')
    }
    options {
        ansiColor('xterm')
        timestamps()
    }
    stages {
        stage('Prepare') {
            steps {
              sh 'yarn'
              sh 'yarn build'
            }
        }
        stage('Test') {
          parallel {
            stage('Unit tests') {
              steps {
                sh 'yarn test:unit'
              }
            }
            stage('Integration tests') {
              steps {
                sh 'yarn test:unit'
              }
            }
          }
        }
        stage('Build') {
          steps {
            sh 'yarn build'
          }
        }

        stage('Create GitHub release') {
            when {
                anyOf {
                    tag '*'
                }
            }
            steps {
                sh '''
                    wget -q -O - https://github.com/git-chglog/git-chglog/releases/download/v0.10.0/git-chglog_0.10.0_linux_amd64.tar.gz | tar xzf -
                    ./git-chglog --output CHANGELOG.md $TAG_NAME

                    wget -q -O - https://github.com/cli/cli/releases/download/v1.6.2/gh_1.6.2_linux_amd64.tar.gz | tar xzf -
                    ./gh_1.6.2_linux_amd64/bin/gh auth status
                    ./gh_1.6.2_linux_amd64/bin/gh release -R $GIT_URL create $TAG_NAME --title $TAG_NAME -F CHANGELOG.md -d
                '''
            }
        }
    }
}
