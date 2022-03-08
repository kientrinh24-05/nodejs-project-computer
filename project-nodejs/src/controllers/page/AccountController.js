const moment = require('moment');
const md5 = require('md5');
const controller = {};

controller.login = (req, res) => {
    const errorValidate = req.session.Error;
    const successAlert = req.session.Success;
    delete req.session.Error;
    delete req.session.Success;

    if (req.session.Customer) res.redirect('/');
    res.render('page/login',
        {
            layout: './layout/_layoutPageMember',
            extractScripts: true,
            extractStyles: true,
            errorValidate: errorValidate,
            successAlert: successAlert,
        }
    );
};

controller.postLogin = (req, res) => {
    const urlBack = req.body.urlBack ?? '';
    const username = req.body.username;
    const errors = [];
    // validate this ... 

    if (username == null || username.trim() == '') {
        errors.push("Vui lòng nhập tài khoản!")
    }

    if (req.body.password == null || req.body.password.trim() == '') {
        errors.push("Vui lòng nhập mật khẩu !")
    }

    if (errors.length > 0) {
        req.session.Error = errors[0];
        res.redirect('/dang-nhap');
        return;
    }

    const password = md5(req.body.password);


    req.getConnection((err, conn) => {

        conn.query(` select *
            from users u 
            join userroles u2 
            on u.id = u2.userId 
            join roles r 
            on r.id = u2.roleId  where username = ? and password = ?  and exists (
            select 1 
            from roles r 
            join userRoles u2 
            on r.id = u2.roleId 
            where u.id = u2.userId and (lower(r.name) = 'customer'))`
            , [username, password], (err, customer) => {
                if (customer?.length > 0) {
                    req.session.Customer = {
                        ...customer[0]
                    };
                    if(urlBack){
                        res.redirect("/" + urlBack);
                    }
                    else{
                        res.redirect("/");
                    }

                }
                else {
                    req.session.Error = "Sai tên đăng nhập hoặc mật khẩu";
                    res.redirect("/dang-nhap");
                }
            });

        //check email and password

    });
}


controller.postRegister = (req, res) => {

    const errors = [];
    const username = req.body.username;
    const email = req.body.email;

    if (username == null || username.trim() == '') {
        errors.push("Vui lòng nhập tài khoản !")
    }

    if (req.body.password == null || req.body.password.trim() == '') {
        errors.push("Vui lòng nhập mật khẩu !")
    }

    if (email == null || email.trim() == '') {
        errors.push("Vui lòng nhập email !")
    }

    if (errors.length > 0) {
        req.session.Error = errors[0];
        res.redirect("/dang-nhap");
        return;
    }

    const password = md5(req.body.password);
    const user = [username, password, email, '/static/assets/uploads/admin/profile.png', 1];
    req.getConnection((err, conn) => {
        conn.query('INSERT INTO users (username,password,email,avatar, userStatus) values ?', [[user]], (err, u) => {
           console.log(err, 'err')
            let userRoles = [u.insertId, 3];
            console.log(userRoles, 'userRoles')
            conn.query('INSERT INTO userRoles (userId,roleId) values ?', [[userRoles]], (err, u) => {
                console.log(err);
                if (err) {
                    req.session.Error = "Vui lòng thử lại";
                }
                else {
                    req.session.Success = "Tạo tài khoản thành công"
                }
                res.redirect("/dang-nhap");
            })
        });
    });

}

controller.getLogout = (req, res) => {
    delete req.session.Customer;
    res.redirect("/dang-nhap");
};



controller.profile = (req, res) => {
    const errorValidate = req.session.Error;
    const successAlert = req.session.Success;
    delete req.session.Error;
    delete req.session.Success;
    const currentUserId = req.session.Customer?.userId ?? 1;
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
                    where o.customerId  = ${currentUserId}
                    ORDER BY id DESC limit ? offset ? ; 
                    SELECT COUNT(*) as Total FROM orders ;
                    SELECT * FROM users WHERE customerBy = ${currentUserId}
                    `
            ;
        conn.query(sql, [parseInt(pageSize), (page - 1) * pageSize], (err, data) => {
            console.log(err,'err')
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
                    res.render('page/profile',
                        {
                            layout: './layout/_layoutPageMember',
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
                            title: 'Hồ sơ',
                            moment: moment
                        }
                    );
                }
            });
        });


    });


};
module.exports = controller;