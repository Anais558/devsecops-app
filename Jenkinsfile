pipeline {
    agent any

    tools {
        nodejs 'NodeJS-22'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo 'Code récupéré depuis GitHub'
            }
        }

        stage('Install Backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Security Audit Backend') {
            steps {
                dir('backend') {
                    sh 'npm audit --audit-level=high || true'
                }
            }
        }

        stage('Security Audit Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm audit --audit-level=high || true'
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline Jenkins réussi !'
        }
        failure {
            echo 'Pipeline Jenkins échoué !'
        }
    }
}