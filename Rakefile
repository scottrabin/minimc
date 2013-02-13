APP_DIR = "./app"
OUT_DIR = "./build"
JS_OUT = "minimc.js"
STYLESHEETS = %w[screen theme-dark]

namespace :build do
	directory OUT_DIR

	desc "Copy the app markup and modify the script tags"
	task :html => OUT_DIR do
		built_scripts = <<-scripts
<script src="./jquery.min.js"></script>
<script src="./minimc.js"></script>
		scripts
		infile = File.read(File.join APP_DIR, 'index.html')
		File.open(File.join(OUT_DIR, 'index.html'), 'w') do |out|
			out.write infile.gsub(/<script.*>.*<\/script>/m, built_scripts)
		end
	end

	namespace :js do
		desc "Copy the jQuery dependency to the build directory"
		task :jquery => OUT_DIR do
			cp File.join(APP_DIR, 'components/jquery/jquery.min.js'), File.join(OUT_DIR, 'jquery.min.js')
		end
		file JS_OUT => [OUT_DIR] + Dir["#{APP_DIR}/**/*.js"] do |task|
			sh "r.js -o ./app.build.js out=#{OUT_DIR}/#{task.name}"
		end
	end
	desc "Compile & copy the javascript to the build directory"
	task :js => ['build:js:jquery', JS_OUT]

	namespace :css do
		STYLESHEETS.each do |name|
			out_css = File.join(OUT_DIR, 'css', "#{name}.css")
			built_css = File.join(APP_DIR, 'css', "#{name}.css")

			file out_css => built_css
			file built_css => Dir["./sass/**/*.scss"] do
				sh "compass compile"
			end
		end
	end
	desc "Compile & copy the stylesheets to the build directory"
	task :css => [OUT_DIR] + STYLESHEETS.map { |name| File.join(OUT_DIR, 'css', "#{name}.css") } do
		cp_r File.join(APP_DIR, 'css'), OUT_DIR
	end

	desc "Copy the plugin metadata to the build directory"
	task :metadata => OUT_DIR do
		cp File.join(APP_DIR, 'addon.xml'), File.join(OUT_DIR, 'addon.xml')
	end

	namespace :demo do
		desc "Copy the jQuery dependency to the build directory and build an alternate app payload"
		task :js => OUT_DIR do
			cp File.join(APP_DIR, 'components/jquery/jquery.js'), File.join(OUT_DIR, 'jquery.min.js')
			sh "r.js -o ./app.build.js paths.js/services/Ajax=js/services/AjaxDemo optimize=none out=#{OUT_DIR}/#{JS_OUT}"
		end
	end
	desc "Build the demo app"
	task :demo => ['build:demo:js', 'build:html', 'build:css']
end
task :build => ['build:html', 'build:js', 'build:css', 'build:metadata']

desc "Clean the output directory"
task :clean do
	rm_rf "#{OUT_DIR}/"
end

task :default => ['build:html', 'build:js', 'build:css', 'build:metadata']
