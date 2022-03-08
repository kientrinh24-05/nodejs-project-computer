const moment = require('moment');
const controller = {};

controller.index = (req, res) => {
    console.log("cart page")

    res.render('page/cart',
        {
            layout: './layout/_layoutPageMember',
            extractScripts: true,
            extractStyles: true,
        }
    );

};

controller.checkOut = (req, res) => {

    const { cart } = req.body;
    let total = 0;
    cart.forEach(item => total += item.price * item.qty);
    const currentUserId = req.session.Customer?.userId ?? 1;
    const errors = [];


    req.getConnection((err, connection) => {
        const sqlOrder = `select o.id from orders o order by o.id desc limit 1`;
        connection.query(sqlOrder, (err, data) => {

            const id = data[0] ? data[0].id + 1 : 1;
            const code = 'DH0' + id;
            const sqlInsert = `INSERT INTO .orders (id,code, userId, customerId, amount, status, createTime, note, checked)
                                   VALUES(${id + 1},'${code}', 1 , ${currentUserId}, ${total}, 3, current_timestamp(), '', 0); `;

            connection.query(sqlInsert, (err, data) => {
                const details = cart.map(item => {
                    return [
                        id + 1, item.id, item.qty, item.price * item.qty
                    ]
                });
                
                connection.query('INSERT INTO orderdetails (orderId,productId,quantity,amount) values ?', [details], (err, u) => {
                    res.json({
                        success: true,
                        data: details
                    });
                })

            });


        });
    });

};


module.exports = controller;