const controller = {};
const md5 = require('md5');

controller.init = (req, res) => {
    req.getConnection((err, conn) => {
        conn.query('SELECT * FROM users where username = "admin" ', (err, admin) => {
            if (admin?.length > 0) {
                console.log("ADMIN INITIALIZED !");
            }
            else {
                // init roles 
                const roles = [[1,'admin'], [2,'employee'], [3,'customer']];
                conn.query('INSERT INTO roles (id,name) values ?', [roles], (err, r) => {
                });
                // init users
                const users = [
                    [1,'admin', md5('123456'), 'admin@gmail.com', 'Admin', 1,'/static/assets/uploads/admin/profile.png'],
                    [2,'employee', md5('123456'), 'employee@gmail.com', 'Employee', 1,'/static/assets/uploads/admin/profile.png'],
                    [3,'customer', md5('123456'), 'customer@gmail.com', 'Customer', 1,'/static/assets/uploads/admin/profile.png'],
                ];

                conn.query('INSERT INTO users (id,username,password,email,fullname,userStatus,avatar) values ?', [users], (err, u) => {
                    let userRoles = [[1,1],[2,2],[3,3]];
                    conn.query('INSERT INTO userRoles (userId,roleId) values ?', [userRoles], (err, u) => {
                    })
                })
            }
            if (err) {
            }
        });
    });
    res.json("Admin init success");
};

module.exports = controller;