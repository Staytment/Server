var git = require('git-rev');

module.exports = function (req, res) {

  git.long(function (commit) {
    git.branch(function (branch) {
      git.tag(function (tag) {
        res.send({
          'commit': commit,
          'branch': branch,
          'tag': tag
        });
      });
    });
  });
};