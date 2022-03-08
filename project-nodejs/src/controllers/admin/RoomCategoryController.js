const excel = require('exceljs');
const moment = require('moment');
const readXlsxFile = require('read-excel-file/node');
const controller = {};

controller.index = (req, res) => {

    const errorValidate = req.session.Error;
    const successAlert = req.session.Success;
    delete req.session.Error;
    delete req.session.Success;
    const page = req.query.page ?? 1;
    const pageSize = req.query.pageSize ?? 5;
    req.getConnection((err, conn) => {
        const sql = 'SELECT * FROM categories ORDER BY id DESC limit ? offset ?  ; SELECT COUNT(*) as Total FROM categories';
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
                        categories: data[0],
                        curentPage: page,
                        total: data[1][0].Total % pageSize === 0 ? data[1][0].Total / pageSize : Math.floor(data[1][0].Total / pageSize) + 1,
                        title: 'Thiết lập sản phẩm',
                        breadcrumbs: [
                            {
                                title: 'sản phẩm',
                                link: '/admin/room'
                            },
                            {
                                title: 'Danh mục sản phẩm',
                                link: '/admin/room/category'
                            }
                        ],
                        actionSearch: '/admin/room/category/search',
                        q: '',
                        filter: ''
                    }
                );
            }
        });

    });

};
controller.create = (req, res) => {
    const name = req.body.name;
    const status = parseInt(req.body.status);
    const errors = [];
    // validate basic
    if (name.length <= 3) {
        errors.push("Tên danh mục phải lớn hơn 3 kí tự !")
    }
    if (errors.length > 0) {
        req.session.Error = errors[0];
        res.redirect("/admin/room/category");
    }
    else {
        req.getConnection((err, connection) => {
            connection.query('INSERT INTO categories set name = ?, status = ?', [name, status], (err, data) => {
                req.session.Success = "Thêm mới danh mục thành công";
                res.redirect("/admin/room/category");
            })
        });
    }
}

controller.update = (req, res) => {

    const { id } = req.params;
    const name = req.body.name;
    const status = parseInt(req.body.status);
    const errors = [];
    if (name.length <= 3) {
        errors.push("Tên danh mục phải lớn hơn 3 kí tự !")
    }
    if (errors.length > 0) {
        res.redirect("/admin/room/category");
    }
    else {
        req.getConnection((err, connection) => {
            connection.query('UPDATE categories SET ? WHERE ID = ?', [{ name: name, status: status }, id], (err, data) => {
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
}

controller.delete = (req, res) => {
    const { id } = req.params;
    req.getConnection((err, connection) => {
        connection.query('DELETE FROM categories WHERE id = ?', [id], (err, rows) => {
            req.session.Success = "Xóa danh mục thành công";
            res.redirect('/admin/room/category');
        });
    });
}

controller.search = (req, res) => {

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

        let sql = 'SELECT * FROM categories WHERE true ';
        let sqlCount = ' SELECT COUNT(*) as Total FROM categories WHERE true ';
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

        if (startDate != 'Invalid date') {
            sql += ` AND createTime >= '${startDate}'`;
            sqlCount += ` AND createTime >= '${startDate}'`;
            sql += ` AND createTime <= '${endDate}' `;
            sqlCount += ` AND createTime <= '${endDate}'`;
        }


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
                        categories: data[0],
                        curentPage: page,
                        total: data[1][0].Total % pageSize === 0 ? data[1][0].Total / pageSize : Math.floor(data[1][0].Total / pageSize) + 1,
                        title: 'Thiết lập sản phẩm',
                        breadcrumbs: [
                            {
                                title: 'sản phẩm',
                                link: '/admin/room'
                            },
                            {
                                title: 'Danh mục sản phẩm',
                                link: '/admin/room/category'
                            }
                        ],
                        actionSearch: '/admin/room/category/search',
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
    let worksheet = workbook.addWorksheet("danh-muc");
    worksheet.columns = [
        { header: "#", key: "id", width: 5 },
        { header: "Tên danh mục", key: "name", width: 25 },
        { header: "Trạng thái", key: "status", width: 25 },
    ];
    worksheet.getRow(1).font = { bold: true };

    req.getConnection((err, conn) => {
        const sql = `SELECT * FROM categories ORDER BY id DESC`
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
                    "attachment; filename=" + "danh-muc-" + now + ".xlsx"
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
            const sql = "INSERT INTO categories (name,status) VALUES ?";
            connection.query(sql, [rows], (err, data) => {
                req.session.Success = "Import dữ liệu thành công";
                res.redirect("/admin/room/category");
            })
        });
    });
}


module.exports = controller;