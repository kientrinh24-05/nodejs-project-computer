const moment = require('moment');
const controller = {};

controller.index = (req, res) => {
    const sql = `select * from products order by id desc limit 0,6`;
    req.getConnection((err, conn) => {
        conn.query(sql, (err, data) => {
            res.render('page/home',
                {
                    products: data,
                    layout: './layout/_layoutPage',
                    extractScripts: true,
                    extractStyles: true,
                }
            );

        })
    });
};

module.exports = controller;