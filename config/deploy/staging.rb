set :branch, :develop

namespace :deploy do
    after :npm_install, :refresh_seed do
        on roles(:api) do
            within release_path do
                %w(db:migrate:undo:all db:migrate db:seed:all).each do |cmd|
                    execute :npm, 'run', 'sequelize', cmd
                end
            end
        end
    end
end
