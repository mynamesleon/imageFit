var pump = require("pump"),
  gulp = require("gulp"),
  uglify = require("gulp-uglify"),
  uglifycss = require("gulp-uglifycss");

gulp.task("minify:js", function() {
  return pump([gulp.src("src/js/*.js"), uglify(), gulp.dest("dist")]);
});

gulp.task("minify:css", function() {
  return pump([gulp.src("src/css/*.css"), uglifycss(), gulp.dest("dist")]);
});

gulp.task("watch", function() {
  gulp.watch("src/js/*.js", ["minify:js"]);
  gulp.watch("src/css/*.css", ["minify:css"]);
});

gulp.task("default", ["minify:js", "minify:css"]);
