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
        const sql = `select date_format(createTime, "%d/%m/%Y") as day, sum(amount) total,
                    count(*) totalOrder,
                    sum(case when o.status = 1 then 1 else 0 end) totalOrderSuccess,
                    sum(case when o.status = 3 then 1 else 0 end) totalOrderDispose,
                    sum(case when o.status = 2 then 1 else 0 end) totalOrderPending
                    from orders o  
                    where createTime >= '${fromDate}' and createTime <= '${now}' and o.userId = ${currentUserId}
                    group by date_format(createTime, "%d/%m/%Y")
                   `;

        conn.query(sql, (err, data) => {
            console.log(data);
            if (err) {
                res.json(err);
            }
            else {
                res.render('admin/reportRevenue',
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
                                title: 'Báo cáo doanh thu',
                                link: '/admin/report/revenue'
                            }
                        ],
                        actionSearch: '/admin/report/revenue/search',
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
        const sql = `select date_format(createTime, "%d/%m/%Y") as day, sum(amount) total,
                    count(*) totalOrder,
                    sum(case when o.status = 1 then 1 else 0 end) totalOrderSuccess,
                    sum(case when o.status = 3 then 1 else 0 end) totalOrderDispose,
                    sum(case when o.status = 2 then 1 else 0 end) totalOrderPending
                    from orders o  
                    where createTime >= '${req.query.startDate}' and createTime <= '${req.query.endDate}' and o.userId = ${currentUserId}
                    group by date_format(createTime, "%d/%m/%Y")
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
        { header: "Tổng hóa đơn", key: "totalOrder", width: 20 },
        { header: "Đã thanh toán", key: "totalOrderSuccess", width: 20 },
        { header: "Đơn hủy", key: "totalOrderDispose", width: 20 },
        { header: "Đơn chưa xử lý", key: "totalOrderPending", width: 20 },
        { header: "Doanh thu", key: "total", width: 25 },
    ];
    worksheet.getRow(1).font = { bold: true };

    req.getConnection((err, conn) => {
        const sql = `select date_format(createTime, "%d-%m-%Y") as day, sum(amount) total,
        count(*) totalOrder,
        sum(case when o.status = 1 then 1 else 0 end) totalOrderSuccess,
        sum(case when o.status = 3 then 1 else 0 end) totalOrderDispose,
        sum(case when o.status = 2 then 1 else 0 end) totalOrderPending
        from orders o  
        where createTime >= '${startDate}' and createTime <= '${endDate}' and o.userId = ${currentUserId}
        group by date_format(createTime, "%d-%m-%Y")
       `;
        conn.query(sql, (err, data) => {
            const categories = data.map((item, index) => {
                return {
                    id: index + 1,
                    day: item.day,
                    totalOrder: item.totalOrder + "",
                    totalOrderSuccess: item.totalOrderSuccess + "",
                    totalOrderDispose: item.totalOrderDispose + "",
                    totalOrderPending: item.totalOrderPending + "",
                    total: item.total.toLocaleString('vi-VN', { style: 'currency' , currency: 'VND' })
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
                    "attachment; filename=" + "bao-cao-doanh-thu-" + now + ".xlsx"
                );

                return workbook.xlsx.write(res).then(function () {
                    res.status(200).end();
                });
            }
        });

    });

}


module.exports = controller;