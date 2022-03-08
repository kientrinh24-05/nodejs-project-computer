const moment = require('moment');
const controller = {};

controller.index = (req, res) => {
    const page = req.query.page ?? 1;
    const pageSize = req.query.pageSize ?? 4;
    const sql = 'SELECT * FROM products ORDER BY id DESC limit ? offset ?  ; SELECT COUNT(*) as Total FROM products';
    req.getConnection((err, conn) => {
        conn.query(sql, [parseInt(pageSize), (page - 1) * pageSize], (err, data) => {
            res.render('page/shop',
                {
                    products: data[0],
                    curentPage: page,
                    total: data[1][0].Total % pageSize === 0 ? data[1][0].Total / pageSize : Math.floor(data[1][0].Total / pageSize) + 1,
                    layout: './layout/_layoutPageMember',
                    extractScripts: true,
                    extractStyles: true,
                    q: '',
                    filter: ''
                }
            );

        })
    });
};

controller.search = (req, res) => {
    const page = req.query.page ?? 1;
    const pageSize = req.query.pageSize ?? 4;
    const q = req.query.q != undefined ? `%${req.query.q.trim()}%` : '';
    let sql = 'SELECT * FROM products WHERE true ';
    let sqlCount = ' SELECT COUNT(*) as Total FROM products WHERE true ';
    let param = '';
    if (q != '') {
        sql += `AND LOWER(title) LIKE  '${q}'`;
        sqlCount += `AND LOWER(title) LIKE  '${q}'`;
        param = q;
    }
    sql = sql + ' ORDER BY id DESC limit ? offset ? ; ' + sqlCount;
    console.log(sql);
    req.getConnection((err, conn) => {
        conn.query(sql, [parseInt(pageSize), (page - 1) * pageSize], (err, data) => {
            res.render('page/shop',
                {
                    products: data[0],
                    curentPage: page,
                    total: data[1][0].Total % pageSize === 0 ? data[1][0].Total / pageSize : Math.floor(data[1][0].Total / pageSize) + 1,
                    layout: './layout/_layoutPageMember',
                    extractScripts: true,
                    extractStyles: true,
                    q: q,
                }
            );

        })
    });
};

controller.detail = (req, res) => {
    let sql = `SELECT * FROM products p join categories c on p.categoryId = c.id WHERE p.id = ${req.params.id} limit 1 ; `;

    req.getConnection((err, conn) => {
        conn.query(sql, (err, data) => {

            const sqlRelated = `SELECT * FROM products where categoryId = ${data[0].categoryId} ORDER BY id DESC limit 4`;

            conn.query(sqlRelated, (err, data2) => {
                console.log(data2);
                res.render('page/productDetail',
                    {
                        product: data[0],
                        products: data2,
                        layout: './layout/_layoutPageMember',
                        extractScripts: true,
                        extractStyles: true,
                    }
                );
            });
        });
    });

};



module.exports = controller;