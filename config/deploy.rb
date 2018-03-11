lock '~> 3.10.1'

set :application, 'api.getnativelearning.com'
set :repo_url, 'git@github.com:hank-ehly/api.getnativelearning.com.git'

set :deploy_to, "/var/www/#{fetch(:application)}/#{fetch(:stage)}"

append :linked_files, 'config/database.json'
append :linked_dirs, 'config/secrets'

set :default_env, {
        NODE_ENV: fetch(:stage)
}

set :keep_releases, 5
set :locales, %w(en ja)
set :deploy_user, 'getnative'

server '139.162.114.38',
       user: fetch(:deploy_user),
       roles: %w(api),
       ssh_options: {
               forward_agent: false,
               auth_methods: %w(publickey)
       }

namespace :deploy do
    after :updated, :npm_install do
        on roles(:api) do
            within release_path do
                execute :npm, '--production=false', 'install'
            end
        end
    end

    after :publishing, :npm_start do
        on roles(:api) do
            within current_path do
                execute :npm, :run, ['start', fetch(:stage)].join(':')
            end
        end
    end
end
