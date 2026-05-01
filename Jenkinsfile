pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Construction de l image Docker...'
                sh 'docker compose build'
            }
        }

        stage('Test') {
            steps {
                echo 'Lancement des tests...'
                sh 'docker compose run --rm api python -m pytest tests/ -v'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploiement du conteneur...'
                sh 'docker compose up -d'
            }
        }

        stage('Monitor') {
            steps {
                echo 'Verification que l API repond...'
                sh 'curl -f http://localhost:8000/health'
            }
        }
    }

    post {
        success {
            echo 'Pipeline reussi !'
        }
        failure {
            echo 'Pipeline echoue !'
        }
    }
}