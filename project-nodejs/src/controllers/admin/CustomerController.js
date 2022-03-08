const excel = require('exceljs');
const md5 = require('md5');
const moment = require('moment');
const readXlsxFile = require('read-excel-file/node');
const controller = {};

controller.index = (req, res) => {

    const userId = req.session.User?.userId ?? 1;
    const errorValidate = req.session.Error;
    const successAlert = req.session.Success;
    delete req.session.Error;
    delete req.session.Success;
    const roleId = req.session.User?.roleId ?? 1;
    const page = req.query.page ?? 1;
    const pageSize = req.query.pageSize ?? 5;
    req.getConnection((err, conn) => {
        let sql = "";
        if (roleId == 1) {
            sql = `select *
                         from users u 
                         join userRoles ur 
                         on u.id = ur.userId 
                         where ur.roleId  in (2,3) 
                         ORDER BY id DESC limit ? offset ? ;
                         select count(*) as Total
                         from users u 
                         join userRoles ur 
                         on u.id = ur.userId 
                         where ur.roleId  in (2,3) `;
        }
        else {
            sql = `select *
            from users u 
            join userRoles ur 
            on u.id = ur.userId 
            where ur.roleId  in (3) 
            and customerBy in (0,${userId})
            ORDER BY id DESC limit ? offset ? ;
            select count(*) as Total
            from users u 
            join userRoles ur 
            on u.id = ur.userId 
            where ur.roleId  in (2,3) and customerBy in (0,${userId})`;
        }

        conn.query(sql, [parseInt(pageSize), (page - 1) * pageSize], (err, data) => { 
    
            if (err) {
                res.json(err);
            }
            else {
                res.render('admin/customer',
                    {
                        layout: './layout/_layoutAdmin',
                        hideActionSearch: true,
                        hideActionImportExcel: true,
                        hideActionExportExcel: true,
                        extractScripts: true,
                        extractStyles: true,
                        errorValidate: errorValidate,
                        successAlert: successAlert,
                        categories: data[0],
                        curentPage: page,
                        total: data[1][0].Total % pageSize === 0 ? data[1][0].Total / pageSize : Math.floor(data[1][0].Total / pageSize) + 1,
                        title: 'Thiết lập khách hàng',
                        breadcrumbs: [
                            {
                                title: 'Khách hàng',
                                link: '/admin/customer'
                            }
                        ],
                        actionSearch: '/admin/customer/search',
                        q: '',
                        filter: ''
                    }
                );
            }
        });

    });

};
controller.create = (req, res) => {

    const userId = req.session.User?.userId ?? 1;
    const roleId = 3;
    const fullname = req.body.fullname;
    const userStatus = 1;
    const username = req.body.username;
    const email = req.body.email;
    const phone = req.body.phone;
    const address = req.body.address;
    const gender = req.body.gender ?? 1;
    const note = req.body.note;
    const errors = [];


    // validate basic
    if (username.length <= 3) {
        errors.push("Tài khoản khách hàng phải lớn hơn 3 kí tự !")
    }
    if (fullname.length <= 3) {
        errors.push("Tên khách hàng phải lớn hơn 3 kí tự !")
    }
    if (roleId == 1) {
        errors.push("Bạn không thể hack hệ thống");
    }
    if (errors.length > 0) {
        req.session.Error = errors[0];
        res.redirect("/admin/customer");
    }
    else {
        req.getConnection((err, connection) => {
            connection.query(`INSERT INTO users set 
                             fullname = ?, userStatus = ?, username = ?, password = ?, email = ?, phone = ?, address = ?, gender = ?,
                             customerBy = ?
                             `,
                [
                    fullname,
                    userStatus,
                    username,
                    md5('123456'),
                    email,
                    phone,
                    address,
                    gender,
                    userId
                ],
                (err, data) => {
                    const userId = data.insertId;
                    connection.query('INSERT INTO userRoles set roleId = ?, userId = ?', [roleId, userId], (err, data) => {
                        if (err) {
                            res.json(err);
                        }
                        else {
                            req.session.Success = "Thêm mới khách hàng thành công";
                            res.redirect("/admin/customer");
                        }

                    })
                })
        });
    }
}

controller.update = (req, res) => {

    const { id } = req.params;
    const fullname = req.body.fullname;
    const email = req.body.email;
    const phone = req.body.phone;
    const address = req.body.address;
    const note = req.body.note;
    const userStatus = req.body.userStatus ?? 1;

    const status = parseInt(req.body.status);
    const errors = [];
    if (fullname.length  <= 3) {
        errors.push("Tên khách hàng phải lớn hơn 3 kí tự !")
    }


    if (errors.length > 0) {
        res.redirect("/admin/customer");
    }
    else {
        req.getConnection((err, connection) => {
            connection.query('UPDATE users SET ? WHERE ID = ?', 
            [{ fullname: fullname, email: email, phone: phone, address: address, note: note , userStatus: userStatus }, id], 
            (err, data) => {
                res.json(
                    {
                        fullname:fullname,
                        email:email,
                        phone:phone,
                        address:address,
                        note:note,
                        userStatus:userStatus,
                        status: status,
                        message: 'cập nhật khách hàng thành công',
                        success: true
                    });
            })
        });
    }
}

controller.delete = (req, res) => {
    const { id } = req.params;
    const userId = req.session.User?.userId ?? 1;
    req.getConnection((err, connection) => {
        connection.query(`DELETE FROM userroles WHERE userid = ?`, [id], (err, rows) => {
            connection.query(`DELETE FROM users WHERE id = ?`, [id], (err, rows) => {
                if(err){
                    req.session.Error = "Vui lòng xóa đơn hàng của khách hàng trước";
                }
                else{
                    req.session.Success = "Xóa khách hàng thành công";
                }
                res.redirect('/admin/customer');
            });
        });
    });
}

controller.search = (req, res) => {
    const userId = req.session.User?.userId ?? 1;
    const errorValidate = req.session.Error;
    const successAlert = req.session.Success;
    delete req.session.Error;
    delete req.session.Success;
    const page = req.query.page ?? 1;
    const pageSize = req.query.pageSize ?? 5;
    const q = req.query.q != undefined ? `%${req.query.q.trim()}%` : '';
    const filterStatus = req.query.filterStatus;

    let startDate = moment(req.query.startDate, 'DD-MM-YYYY');
    startDate = startDate.format('yyyy/MM/DD')
    let endDate = moment(req.query.endDate, 'DD-MM-YYYY');
    endDate = endDate.format('yyyy/MM/DD')

    req.getConnection((err, conn) => {

        let sql = `SELECT * FROM users WHERE  customerBy in (0,${userId})`;
        let sqlCount = `SELECT COUNT(*) as Total FROM users WHERE  customerBy in (0,${userId}) `;
        let param = '';
        if (q != '') {
            sql += ` AND LOWER(fullname) LIKE  '${q}'`;
            sqlCount += ` AND LOWER(fullname) LIKE  '${q}'`;
            param = q;
        }

        if (filterStatus != undefined && filterStatus != '') {
            sql += ` AND status = ${filterStatus}`;
            sqlCount += ` AND status = ${filterStatus}`;
        }


        if (startDate != 'Invalid date') {
            sql += ` AND createTime >= '${startDate}'`;
            sqlCount += ` AND createTime >= '${startDate}'`;
            sql += ` AND createTime <= '${endDate}' `;
            sqlCount += ` AND createTime <= '${endDate}'`;
        }



        sql = sql + ' ORDER BY id DESC limit ? offset ? ; ' + sqlCount;
        conn.query(sql, [parseInt(pageSize), (page - 1) * pageSize], (err, data) => {
            console.log(sql);
            console.log(data);
            if (err) {
                res.json(err);
            }
            else {
                res.render('admin/customer',
                    {
                        layout: './layout/_layoutAdmin',
                        extractScripts: true,
                        extractStyles: true,
                        hideActionSearch: true,
                        hideActionImportExcel: true,
                        hideActionExportExcel: true,
                        errorValidate: errorValidate,
                        successAlert: successAlert,
                        categories: data[0],
                        curentPage: page,
                        total: data[1][0].Total % pageSize === 0 ? data[1][0].Total / pageSize : Math.floor(data[1][0].Total / pageSize) + 1,
                        title: 'Khách hàng',
                        breadcrumbs: [
                            {
                                title: 'Khách hàng',
                                link: '/admin/customer'
                            }
                        ],
                        actionSearch: '/admin/customer/search',
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
    let worksheet = workbook.addWorksheet("khach-hang");
    worksheet.columns = [
        { header: "#", key: "id", width: 5 },
        { header: "Tên khách hàng", key: "name", width: 25 },
        { header: "Trạng thái", key: "status", width: 25 },
    ];
    worksheet.getRow(1).font = { bold: true };

    req.getConnection((err, conn) => {
        const sql = `SELECT * FROM roomCategories ORDER BY id DESC`
        conn.query(sql, (err, data) => {
            const categories = data.map((item, index) => {
                return {
                    id: index,
                    name: item.name,
                    status: item.status == 1 ? 'Hoạt động' : 'Không hoạt động'
                }
            });

            if (err) {
                res.json(err);
            }
            else {
                worksheet.addRows(categories);

                res.setHeader(
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                );
                res.setHeader(
                    "Content-Disposition",
                    "attachment; filename=" + "khach-hang-" + now + ".xlsx"
                );

                return workbook.xlsx.write(res).then(function () {
                    res.status(200).end();
                });
            }
        });

    });

}

controller.importExcel = async (req, res) => {

    let filename = global.__basedir + req.body['path-excel-import'];
    readXlsxFile(filename).then((rows) => {

        const activeStatus = 1;
        const unactiveStatus = 2;
        rows = rows.map(item => {
            if (item[2].toLowerCase().trim() == 'không hoạt động') {
                item[2] = activeStatus;
            }
            else if (item[2].toLowerCase().trim() == 'hoạt động') {
                item[2] = unactiveStatus;
            }

            return [item[1], item[2]]
        });
        req.getConnection((err, connection) => {
            const sql = "INSERT INTO roomCategories (name,status) VALUES ?";
            connection.query(sql, [rows], (err, data) => {
                req.session.Success = "Import dữ liệu thành công";
                res.redirect("/admin/customer");
            })
        });
    });
}


module.exports = controller;