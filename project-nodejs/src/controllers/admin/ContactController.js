const controller = {};
const moment = require('moment');

controller.index = (req, res) => {

    const errorValidate = req.session.Error;
    const successAlert = req.session.Success;
    delete req.session.Error;
    delete req.session.Success;

    const page = req.query.page ?? 1;
    const pageSize = req.query.pageSize ?? 5;
    req.getConnection((err, conn) => {
        const sql = `SELECT * FROM contacts ORDER BY id DESC limit ? offset ?  ;
                     SELECT COUNT(*) as Total FROM contacts`;
        conn.query(sql, [parseInt(pageSize), (page - 1) * pageSize], (err, data) => {
            if (err) {
                res.json(err);
            }
            else {
                res.render('admin/contact',
                    {
                        layout: './layout/_layoutAdmin',
                        extractScripts: true,
                        extractStyles: true,
                        errorValidate: errorValidate,
                        successAlert: successAlert,
                        hideActionImportExcel: true,
                        hideActionExportExcel: true,
                        hideActionFillter: true,
                        hideActionAdd: true,
                        categories: data[0],
                        curentPage: page,
                        total: data[1][0].Total % pageSize === 0 ? data[1][0].Total / pageSize : Math.floor(data[1][0].Total / pageSize) + 1,
                        title: 'Phản hồi khách hàng',
                        breadcrumbs: [
                            {
                                title: 'Liên hệ',
                                link: '/admin/contact'
                            }

                        ],
                        actionSearch: '/admin/contact/search',
                        q: '',
                        filter: ''
                    }
                );
            }
        });

    });

};

controller.update = (req, res) => {

    const { id } = req.params;
    const status = parseInt(req.body.status);
    console.log(status,'status');
    req.getConnection((err, connection) => {
        connection.query('UPDATE contacts SET ? WHERE ID = ?', [{ contactStatus: status }, id], (err, data) => {
            res.json(
                {
                    status: status,
                    message: 'cập nhật liên hệ thành công',
                    success: true
                });
        })
    });
}

controller.delete = (req, res) => {
    const { id } = req.params;
    req.getConnection((err, connection) => {
        connection.query('DELETE FROM contacts WHERE id = ?', [id], (err, rows) => {
            req.session.Success = "Xóa liên hệ thành công";
            res.redirect('/admin/contact');
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
    const q = req.query.q == undefined || req.query.q == '' ? '' : `%${req.query.q.trim()}%`;
    const filterStatus = req.query.filterStatus;

    let startDate = moment(req.query.startDate, 'DD-MM-YYYY');
    startDate = startDate.format('yyyy/MM/DD')
    let endDate = moment(req.query.endDate, 'DD-MM-YYYY');
    endDate = endDate.format('yyyy/MM/DD')

    req.getConnection((err, conn) => {

        let sql = 'SELECT * FROM contacts WHERE true ';
        let sqlCount = ' SELECT COUNT(*) as Total FROM contacts WHERE true ';
        let param = '';
        if (q != '') {
            sql += `AND LOWER(fullname) LIKE  '${q}'`;
            sqlCount += `AND LOWER(fullname) LIKE  '${q}'`;
            param = q;
        }

        sql = sql + ' ORDER BY id DESC limit ? offset ? ; ' + sqlCount;
        conn.query(sql, [parseInt(pageSize), (page - 1) * pageSize], (err, data) => {

            if (err) {
                res.json(err);
            }
            else {
                res.render('admin/contact',
                    {
                        layout: './layout/_layoutAdmin',
                        hideActionImportExcel: true,
                        extractScripts: true,
                        extractStyles: true,
                        errorValidate: errorValidate,
                        successAlert: successAlert,
                        hideActionImportExcel: true,
                        hideActionExportExcel: true,
                        hideActionFillter: true,
                        hideActionAdd: true,
                        categories: data[0],
                        curentPage: page,
                        total: data[1][0].Total % pageSize === 0 ? data[1][0].Total / pageSize : Math.floor(data[1][0].Total / pageSize) + 1,
                        title: 'Thiết lập sản phẩm',
                        breadcrumbs: [
                            {
                                title: 'Liên hệ',
                                link: '/admin/contact'
                            },
                            {
                                title: 'liên hệ sản phẩm',
                                link: '/admin/contact'
                            }
                        ],
                        actionSearch: '/admin/contact/search',
                        q: q,
                        filter: filterStatus
                    }
                );
            }
        });

    });

};

module.exports = controller;