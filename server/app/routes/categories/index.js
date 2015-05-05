// ******************************************
// internal API endpoint for categories
// *******************************************

var mongoose = require('mongoose');
var router = require('express').Router();
module.exports = router;

var CategoriesModel = mongoose.model('Category');

router.get('/', function (req, res) {

    CategoriesModel.find({}, function (err, categories) {
            if(err) throw err
            // console.log("FILMS-SERVER-Side",films);
            res.send(categories);
    });

});

router.post('/', function (req, res, next) {

  var newCategory = new CategoriesModel({
    name: req.body.name
  });

  newCategory.save(function (err) {
    if (err) {
      return next(err);
    }
    return res.send('Success in creating');
})

});

router.delete('/:id', function (req, res, next) {
  var id = req.params.id;
  return CategoriesModel.findById(id, function (err, category) {
    return category.remove(function (err) {
      if (err) {
        return next(err);
      }
      return res.send('Success in deletion');
    })
  })
});