const excel = require('exceljs');
const moment = require('moment');
const controller = {};

controller.index = (req, res) => {
    const errorValidate = req.session.Error;
    const successAlert = req.session.Success;
    delete req.session.Error;
    delete req.session.Success;
    const currentUserId = req.session.User?.userId ?? 1;
    const now = moment().format("yyyy/MM/DD");
    const fromDate = moment().subtract(6, 'days').format("yyyy/MM/DD");

    req.getConnection((err, conn) => {
        const sql = `select date_format(o2.createTime, "%d-%m-%Y") as day, count(distinct(o2.customerId)) total,
                count(distinct (case when date_format(o2.createTime, "%d-%m-%Y") <= date_format(u.createTime, "%d-%m-%Y")   then o2.customerId end))  totalNewCustomer,
                count(distinct (case when date_format(o2.createTime, "%d-%m-%Y") > date_format(u.createTime, "%d-%m-%Y") then o2.customerId  end)) totalOldCustomer
                from users u 
                join userroles u2
                on u.id = u2.userId 
                join orders o2 
                on u.id = o2.customerId 
                where u2.roleId = 3 and o2.userId = ${currentUserId}
                and o2.createTime >= '${fromDate}' and o2.createTime <= '${now}'
                group by date_format(o2.createTime, "%d-%m-%Y")
                   `;

        conn.query(sql, (err, data) => {
            console.log(data);
            if (err) {
                res.json(err);
            }
            else {
                res.render('admin/reportCustomer',
                    {
                        layout: './layout/_layoutAdmin',
                        extractScripts: true,
                        extractStyles: true,
                        errorValidate: errorValidate,
                        successAlert: successAlert,
                        hideActionAdd: true,
                        hideActionSearch: true,
                        hideActionImportExcel: true,
                        categories: data,
                        total: 1,
                        title: 'Báo cáo',
                        breadcrumbs: [
                            {
                                title: 'Báo cáo',
                                link: '#'
                            },
                            {
                                title: 'Báo cáo khách hàng',
                                link: '/admin/report/customer'
                            }
                        ],
                        actionSearch: '/admin/report/customer/search',
                        q: '',
                        filter: ''
                    }
                );
            }
        });

    });

};

controller.search = (req, res) => {
    const currentUserId = req.session.User?.userId ?? 1;
    req.getConnection((err, conn) => {
                        const sql = `select date_format(o2.createTime, "%d-%m-%Y") as day, count(distinct(o2.customerId)) total,
                        count(distinct (case when date_format(o2.createTime, "%d-%m-%Y") <= date_format(u.createTime, "%d-%m-%Y")   then o2.customerId end))  totalNewCustomer,
                        count(distinct (case when date_format(o2.createTime, "%d-%m-%Y") > date_format(u.createTime, "%d-%m-%Y") then o2.customerId  end)) totalOldCustomer
                        from users u 
                        join userroles u2
                        on u.id = u2.userId 
                        join orders o2 
                        on u.id = o2.customerId 
                        where u2.roleId = 3 and o2.userId = ${currentUserId}
                        and o2.createTime >= '${req.query.startDate}' and o2.createTime <= '${req.query.endDate}'
                        group by date_format(o2.createTime, "%d-%m-%Y")
                   `;

        conn.query(sql, (err, data) => {
            res.json(data);
            if (err) {
                res.json(err);
            }
        });
    });

};

controller.exportExcel = (req, res) => {
    const currentUserId = req.session.User?.userId ?? 1;
    const startDate = req.query.startDate ?? moment().subtract(6, 'days').format("yyyy/MM/DD") ;
    const endDate = req.query.endDate ?? moment().format("yyyy/MM/DD");
    const now = Date.now();
    let workbook = new excel.Workbook();
    let worksheet = workbook.addWorksheet("bao-cao-doanh-thu");
    worksheet.columns = [
        { header: "#", key: "id", width: 5 },
        { header: "Thời gian", key: "day", width: 20 },
        { header: "Khách hàng mới", key: "totalNewCustomer", width: 20 },
        { header: "Khách hàng cũ", key: "totalOldCustomer", width: 20 },
        { header: "Tỉ lệ khách hàng mới", key: "totalNewCustomerRatio", width: 20 },
        { header: "Tỉ lệ khách hàng cũ", key: "totalOldCustomerRatio", width: 20 },
    ];
    worksheet.getRow(1).font = { bold: true };

    req.getConnection((err, conn) => {

        const sql = `select date_format(o2.createTime, "%d-%m-%Y") as day, count(distinct(o2.customerId)) total,
        count(distinct (case when date_format(o2.createTime, "%d-%m-%Y") <= date_format(u.createTime, "%d-%m-%Y")   then o2.customerId end))  totalNewCustomer,
        count(distinct (case when date_format(o2.createTime, "%d-%m-%Y") > date_format(u.createTime, "%d-%m-%Y") then o2.customerId  end)) totalOldCustomer
        from users u 
        join userroles u2
        on u.id = u2.userId 
        join orders o2 
        on u.id = o2.customerId 
        where u2.roleId = 3 and o2.userId = ${currentUserId}
        and o2.createTime >= '${startDate}' and o2.createTime <= '${endDate}'
        group by date_format(o2.createTime, "%d-%m-%Y")`;
        conn.query(sql, (err, data) => {
            const categories = data.map((item, index) => {
                return {
                    id: index + 1,
                    day: item.day,
                    totalNewCustomer: item.totalNewCustomer + "",
                    totalOldCustomer: item.totalOldCustomer + "",
                    totalNewCustomerRatio: item.totalNewCustomer / item.total * 100 + "%",
                    totalOldCustomerRatio: item.totalOldCustomer / item.total * 100 + "%",
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
                    "attachment; filename=" + "bao-cao-khach-hang-" + now + ".xlsx"
                );

                return workbook.xlsx.write(res).then(function () {
                    res.status(200).end();
                });
            }
        });

    });

}


module.exports = controller;