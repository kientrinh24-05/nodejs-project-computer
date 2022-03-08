const excel = require('exceljs');
const moment = require('moment');
const readXlsxFile = require('read-excel-file/node');
const md5 = require('md5');
const controller = {};

controller.index = (req, res) => {

    const errorValidate = req.session.Error;
    const successAlert = req.session.Success;
    delete req.session.Error;
    delete req.session.Success;
    const currentUserId = req.session.User?.userId ?? 1;
    const page = req.query.page ?? 1;
    const pageSize = req.query.pageSize ?? 5;
    req.getConnection((err, conn) => {
        const sql = `select o.id, o.code , o.customerId , o.amount , o.status , o.createTime , o.updateTime, o.note ,
                            c.username , c.id as cid, c.username as cUsername, c.fullname as cFullname, 
                            u.username , u.id as uid, u.username as uUsername, u.fullname as uFullname
                    from orders o 
                    left join users c 
                    on c.id = o.customerId
                    left join users u 
                    on u.id = o.userId 
                    where u.id  = ${currentUserId}
                    ORDER BY id DESC limit ? offset ? ; 
                    SELECT COUNT(*) as Total FROM orders ;
                    SELECT * FROM users WHERE customerBy = ${currentUserId}
                    `
            ;
        conn.query(sql, [parseInt(pageSize), (page - 1) * pageSize], (err, data) => {
            let orderIds = data[0].map(item => item.id).join();
            if (orderIds.length > 0) {
                orderIds = "in (" + orderIds + ")"
            }
            else {
                orderIds = "";
            }

            const sqlOrderDetail = `select *
                                    from orderdetails o 
                                    where o.orderId ${orderIds}`;

            conn.query(sqlOrderDetail, (errOrderDetail, dataOrderDetail) => {

                // map orderDetails to order
                data[0] = data[0].map(item => {
                    const orderDetails = dataOrderDetail.filter(d => d.orderId == item.id);
                    if (orderDetails) {
                        item.orderDetails = [...orderDetails];
                    }
                    return item;
                });

                if (err) {
                    res.json(err);
                }
                else {
                    res.render('admin/order',
                        {
                            layout: './layout/_layoutAdmin',
                            extractScripts: true,
                            extractStyles: true,
                            errorValidate: errorValidate,
                            successAlert: successAlert,
                            hideActionImportExcel: true,
                            hideActionFillter: true,
                            categories: data[0],
                            customers: data[2],
                            curentPage: page,
                            total: data[1][0].Total % pageSize === 0 ? data[1][0].Total / pageSize : Math.floor(data[1][0].Total / pageSize) + 1,
                            title: 'Thiết lập hóa đơn',
                            breadcrumbs: [
                                {
                                    title: 'Hóa đơn',
                                    link: '/admin/order'
                                }
                            ],
                            actionSearch: '/admin/order/search',
                            q: '',
                            filter: '',
                            moment: moment
                        }
                    );
                }
            });
        });


    });

};

controller.detail = (req, res) => {
    const { id } = req.params;
    req.getConnection((err, conn) => {

        const sql = `select o.id, o.code , o.timeCheckout, o.customerId , o.amount , o.status , o.createTime , o.updateTime, o.note ,
                     
                            c.username , c.id as cid, c.username as cUsername, c.phone as cPhone, c.email as cEmail,  c.fullname as cFullname, 
                            u.username , u.id as uid, u.username as uUsername, u.fullname as uFullname
                    from orders o 
                    left join users c 
                    on c.id = o.customerId
                    left join users u 
                    on u.id = o.userId 
                    where o.id  = ${id}
                    limit 1
                    `;
        conn.query(sql, (err, data) => {
            console.log(err);

            const sqlOrderDetail = `select *
                                                from orderdetails o 
                                                join products p 
                                                on o.productId = p.id
                                                where o.orderId  = ${id}`;
            conn.query(sqlOrderDetail, (errOrderDetail, dataOrderDetail) => {
                console.log(dataOrderDetail)
                if (dataOrderDetail) {
                    data[0].orderDetails = [...dataOrderDetail];
                }
                res.json({
                    order: data[0]
                });
            });
        });
    });
};

controller.edit = (req, res) => {
    const { id } = req.params;
    const status = req.body.status;
    const note = req.body.note;


    req.getConnection((err, conn) => {
        const sql = `select o.id, o.code , o.timeCheckout, o.customerId , o.amount , o.status , o.createTime , o.updateTime, o.note ,
                            c.username , c.id as cid, c.username as cUsername, c.phone as cPhone, c.email as cEmail,  c.fullname as cFullname, 
                            u.username , u.id as uid, u.username as uUsername, u.fullname as uFullname
                    from orders o 
                    join users c 
                    on c.id = o.customerId
                    join users u 
                    on u.id = o.userId 
                    where o.id  = ${id}
                    limit 1
                    `;
        conn.query(sql, (err, data) => {
            console.log(err)
            const sqlEdit = `UPDATE orders set
                        status=${status},
                        note='${note}'
                        WHERE id=${id};
                        `;
            conn.query(sqlEdit, (err, success) => {

                res.json({
                    update: true
                });
            })
        });
    });
};

controller.create = (req, res) => {

    const currentUserId = req.session.User?.userId ?? 1;
    const username = req.body.username;
    const fullname = req.body.fullname;
    const email = req.body.email;
    const phone = req.body.phone;
    const productId = req.body.productId;
    const price = req.body.price;
    const status = parseInt(req.body.status);
    const errors = [];


    // validate basic

    if (phone.length <= 3) {
        errors.push("Số điện thoại không đúng định dạng!")
    }
    if (errors.length > 0) {
        req.session.Error = errors[0];
        res.redirect("/admin/order");
    }

    else {
        req.getConnection((err, connection) => {
            const foundCustomer = `select * from users u where u.phone = '${phone}';  select o.id from orders o order by o.id desc limit 1`;
            connection.query(foundCustomer, (err, data) => {
                const code = 'DH0' + (data[1][0].id + 1 ?? 1);
                if (data[0].length == 0) {
                    // create customer
                    const user = [
                        username, md5('123456'), email, fullname, 1, '/static/assets/uploads/admin/profile.png'
                    ];

                    connection.query('INSERT INTO users set  username = ? ,password = ? ,email = ?,fullname = ?,userStatus = ?,avatar = ?, phone = ?', [username, md5('123456'), email, fullname, 1, '/static/assets/uploads/admin/profile.png', phone], (err, u) => {
                        let userRoles = [u.insertId, 3];
                        connection.query('INSERT INTO userRoles (userId,roleId) values ?', [userRoles], (err, r) => {

                            const sqlInsert = `INSERT INTO .orders (id,code, userId, productId, customerId, amount, status, createTime, note, checked, timeCheckout)
                            VALUES(${data[1][0].id + 1},'${code}', ${currentUserId}, ${productId}, ${u.insertId}, ${price}, 3, current_timestamp(), '', 0, '${timeCheckout}')); `;

                            connection.query(sqlInsert, (err, u) => {
                                const roomUpdate = `update products set status = 1 where id = ${productId}`;
                                connection.query(roomUpdate, (err, u) => {
                                    req.session.Success = "Thêm đơn hàng thành công";
                                    res.redirect("/admin/order");
                                });
                            });
                        })

                    });

                }
                else {
                    customer = data[0][0];
                    const sqlInsert = `INSERT INTO .orders (id,code, userId, productId, customerId, amount, status, createTime, note, checked, timeCheckout)
                                       VALUES(${data[1][0].id + 1},'${code}', ${currentUserId}, ${productId}, ${customer.id}, ${price}, 3, current_timestamp(), '', 0, '${timeCheckout}'); `;
                    connection.query(sqlInsert, (err, u) => {
                        const roomUpdate = `update products set status = 1 where id = ${productId}`;
                        connection.query(roomUpdate, (err, u) => {
                            req.session.Success = "Thêm đơn hàng thành công";
                            res.redirect("/admin/order");
                        });
                    });
                }
            });
        });
    }
};

controller.update = (req, res) => {

    const { id } = req.params;
    const name = req.body.name;
    const status = parseInt(req.body.status);
    const errors = [];
    if (name.length <= 3) {
        errors.push("Tên danh mục phải lớn hơn 3 kí tự !")
    }
    if (errors.length > 0) {
        res.redirect("/admin/order");
    }
    else {
        req.getConnection((err, connection) => {
            connection.query('UPDATE orders SET ? WHERE ID = ?', [{ name: name, status: status }, id], (err, data) => {
                res.json(
                    {
                        name: name,
                        status: status,
                        message: 'cập nhật danh mục thành công',
                        success: true
                    });
            })
        });
    }
};

controller.delete = (req, res) => {
    const { id } = req.params;
    req.getConnection((err, connection) => {
        connection.query('DELETE FROM orderdetails WHERE orderId = ?', [id], (err, rows) => {
            connection.query('DELETE FROM orders WHERE id = ?', [id], (err, rows) => {
                console.log(err);
                req.session.Success = "Xóa danh mục thành công";
                res.redirect('/admin/order');
            });
        });
    });
};

controller.search = (req, res) => {

    const errorValidate = req.session.Error;
    const successAlert = req.session.Success;
    delete req.session.Error;
    delete req.session.Success;
    const page = req.query.page ?? 1;
    const pageSize = req.query.pageSize ?? 5;
    const q = req.query.q != undefined ? `%${req.query.q}%` : '';
    const filterStatus = req.query.filterStatus;

    let startDate = moment(req.query.startDate, 'DD-MM-YYYY');
    startDate = startDate.format('yyyy/MM/DD')
    let endDate = moment(req.query.endDate, 'DD-MM-YYYY');
    endDate = endDate.format('yyyy/MM/DD')

    req.getConnection((err, conn) => {

        let sql = 'SELECT * FROM orders WHERE true ';
        let sqlCount = ' SELECT COUNT(*) as Total FROM orders WHERE true ';
        let param = '';
        if (q != '') {
            sql += `AND LOWER(name) LIKE  '${q}'`;
            sqlCount += `AND LOWER(name) LIKE  '${q}'`;
            param = q;
        }

        if (filterStatus != undefined && filterStatus != '') {
            sql += `AND status = ${filterStatus}`;
            sqlCount += `AND status = ${filterStatus}`;
        }

        sql += ` AND createTime >= '${startDate}'`;
        sqlCount += ` AND createTime >= '${startDate}'`;
        sql += ` AND createTime <= '${endDate}' `;
        sqlCount += ` AND createTime <= '${endDate}'`;


        sql = sql + ' ORDER BY id DESC limit ? offset ? ; ' + sqlCount;
        conn.query(sql, [parseInt(pageSize), (page - 1) * pageSize], (err, data) => {

            if (err) {
                res.json(err);
            }
            else {
                res.render('admin/category',
                    {
                        layout: './layout/_layoutAdmin',
                        extractScripts: true,
                        extractStyles: true,
                        errorValidate: errorValidate,
                        successAlert: successAlert,
                        hideActionImportExcel: true,
                        hideActionFillter: true,
                        categories: data[0],
                        curentPage: page,
                        total: data[1][0].Total % pageSize === 0 ? data[1][0].Total / pageSize : Math.floor(data[1][0].Total / pageSize) + 1,
                        title: 'Thiết lập hóa đơn',
                        breadcrumbs: [
                            {
                                title: 'hóa đơn',
                                link: '/admin/order'
                            },
                            {
                                title: 'Danh mục hóa đơn',
                                link: '/admin/order'
                            }
                        ],
                        actionSearch: '/admin/order/search',
                        q: q,
                        filter: filterStatus
                    }
                );
            }
        });

    });

};

controller.exportExcel = (req, res) => {

    const now = Date.now();

    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet("don-hang");
    worksheet.columns = [
        { header: "#", key: "code", width: 5 },
        { header: "Khách hàng", key: "customer", width: 25 },
        { header: "Điện thoại", key: "phoneCustomer", width: 25 },
        { header: "Người lên đơn", key: "creator", width: 25 },
        { header: "Tổng tiền", key: "amount", width: 25 },
        { header: "Trạng thái", key: "status", width: 25 },
        { header: "Thời gian", key: "createTime", width: 25 },
    ];
    worksheet.getRow(1).font = { bold: true };

    req.getConnection((err, conn) => {
        const sql = `select o.code, c.fullname as customer, c.phone as phoneCustomer,  u.fullname as creator ,   
                    o.amount , o.status , o.createTime 
                    from orders o 
                    join users u  on o.userId  = u.id 
                    join users c on o.customerId = u.id
                    order by o.id desc `
        conn.query(sql, (err, data) => {
            const orders = data.map((item, index) => {
                return {
                    id: index,
                    code: item.code,
                    customer: item.customer,
                    phoneCustomer: item.phoneCustomer,
                    creator: item.creator,
                    amount: item.amount,
                    status: item.status == 1 ? 'Thành công' : 'Hủy bỏ',
                    createTime: item.createTime
                }
            });

            if (err) {
                res.json(err);
            }
            else {
                worksheet.addRows(orders);

                res.setHeader(
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                res.setHeader(
                    "Content-Disposition",
                    "attachment; filename=" + "don-hang-" + now + ".xlsx"
                );

                return workbook.xlsx.write(res).then(function () {
                    res.status(200).end();
                });
            }
        });

    });

}


module.exports = controller;