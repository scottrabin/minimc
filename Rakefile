APP_DIR = "./app"
OUT_DIR = "./build"
JS_OUT = "./build/minimc.js"
STYLESHEETS = %w[screen theme-dark]

file JS_OUT => Dir["#{APP_DIR}/**/*.js"] do |task|
	sh "r.js -o ./app.build.js out=#{task.name}"
end

STYLESHEETS.each do |name|
	out_css = File.join(OUT_DIR, 'css', "#{name}.css")
	built_css = File.join(APP_DIR, 'css', "#{name}.css")

	file out_css => built_css
	file built_css => Dir["./sass/**/*.scss"] do
		sh "compass compile"
	end
end

task :html do
	built_scripts = <<-scripts
<script src="./jquery.min.js"></script>
<script src="./minimc.js"></script>
scripts
	infile = File.read(File.join APP_DIR, 'index.html')
	File.open(File.join(OUT_DIR, 'index.html'), 'w') do |out|
		out.write infile.gsub(/<script.*>.*<\/script>/m, built_scripts)
	end
end
task :metadata do
	cp File.join(APP_DIR, 'addon.xml'), File.join(OUT_DIR, 'addon.xml')
end
task :js => JS_OUT do
	cp File.join(APP_DIR, 'components/jquery/jquery.min.js'), File.join(OUT_DIR, 'jquery.min.js')
end
task :css => STYLESHEETS.map { |name| File.join(OUT_DIR, 'css', "#{name}.css") } do
	cp_r File.join(APP_DIR, 'css'), OUT_DIR
end

task :clean do
	rm_rf "#{OUT_DIR}/"
end

task :default => [:html, :js, :css, :metadata]
