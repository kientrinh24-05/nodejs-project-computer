const controller = {};
const md5 = require('md5');
const moment = require('moment');

controller.getLogin = (req, res) => {
    if (req.session.User) res.redirect('/admin/dashboard');
    res.render('admin/Login', { layout: false });
};

controller.postLogin = (req, res) => {

    const username = req.body.username;
    const password = md5(req.body.password);

    // validate this ... 

    if (username == null || username.trim() == '') {
        res.json("Vui lòng nhập tài khoản");
    }

    if (password == null || password.trim() == '') {
        res.json("Vui lòng nhập mật khẩu");
    }

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
            where u.id = u2.userId and (lower(r.name) = 'admin' or lower(r.name) = 'employee'))`
            , [username, password], (err, admin) => {
                console.log(admin);
                if (admin?.length > 0) {
                    req.session.User = {
                        ...admin[0]
                    };
                    res.redirect("/admin/dashboard");
                }
                else {
                    res.json("ĐĂNG NHẬP THẤT BẠI");
                }
            });

        //check email and password

    });
}

controller.getLogout = (req, res) => {
    delete req.session.User;
    res.redirect("/admin/login");
};


controller.profile = (req, res) => {

    const userId = req.session.User?.userId ?? 1;
    const errorValidate = req.session.Error;
    const successAlert = req.session.Success;
    delete req.session.Error;
    delete req.session.Success;

    const sqlProfile = `SELECT * FROM users where id = ${userId} limit 1`;

    req.getConnection((err, conn) => {

        conn.query(sqlProfile, (err, success) => {
            console.log(success);
            res.render('admin/profile',
                {
                    extractScripts: true,
                    extractStyles: true,
                    layout: './layout/_layoutAdminProfile',
                    errorValidate: errorValidate,
                    profile: success[0],
                    moment: moment,
                    errorValidate: errorValidate,
                    successAlert: successAlert,
                }
            );
        });

    });
};



module.exports = controller;