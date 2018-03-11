set :branch, :master

namespace :deploy do
    after :npm_install, :migrate do
        on roles(:api) do
            within release_path do
                execute :npm, 'run', 'sequelize', 'db:migrate'
            end
        end
    end
end
