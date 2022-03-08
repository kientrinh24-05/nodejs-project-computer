const moment = require('moment');
const controller = {};

controller.index = (req, res) => {

    res.render('page/blog',
        {
            layout: './layout/_layoutPageMember',
            extractScripts: true,
            extractStyles: true,
        }
    );
};


controller.detail = (req, res) => {

    res.render('page/blogDetail',
        {
            layout: './layout/_layoutPageMember',
            extractScripts: true,
            extractStyles: true,
        }
    );
};

module.exports = controller;