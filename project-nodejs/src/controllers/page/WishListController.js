const moment = require('moment');
const controller = {};

controller.index = (req, res) => {
    res.render('page/wishList',
        {
            layout: './layout/_layoutPageMember',
            extractScripts: true,
            extractStyles: true,
        }
    );

};

module.exports = controller;