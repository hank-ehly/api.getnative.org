set :branch, :develop

after 'npm:install', :reset_db do
    on roles(:api) do
        %w(sequelize:migrate:undo:all sequelize:migrate sequelize:seed:all).each do |t|
            invoke t
        end
    end
end
