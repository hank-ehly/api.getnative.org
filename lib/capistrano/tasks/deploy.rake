namespace :deploy do
    namespace :check do
        desc 'Upload local linked files to remote shared'
        task :upload_linked_files do
            on roles(:api) do
                info 'Uploading linked files'
                fetch(:linked_files, []).each do |file|
                    upload! file, [shared_path, file].join('/')
                end
            end
        end
    end
end