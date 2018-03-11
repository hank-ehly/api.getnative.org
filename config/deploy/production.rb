set :branch, :master

after 'npm:install', 'sequelize:migrate'
