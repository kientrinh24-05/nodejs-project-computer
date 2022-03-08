const moment = require('moment');
const controller = {};

controller.index = (req, res) => {
    const errorValidate = req.session.Error;
    const successAlert = req.session.Success;
    delete req.session.Error;
    delete req.session.Success;
    res.render('page/contact',
        {
            layout: './layout/_layoutPageMember',
            extractScripts: true,
            extractStyles: true,
            errorValidate: errorValidate,
            successAlert: successAlert,
        }
    );
};


controller.create = (req, res) => {

    const {
        fullname,
        email,
        phone,
        subject,
        content } = req.body;

        

    const errors = [];
    // validate basic
    if (fullname.length <= 1) {
        errors.push("Họ tên không hợp lệ")
    }
    if (errors.length > 0) {
        req.session.Error = errors[0];
        res.redirect("/lien-he");
    }
    else {
        req.getConnection((err, connection) => {
            connection.query('INSERT INTO contacts set fullname = ?, email = ?, phone = ?, subject = ?, content = ?', 
                [
                fullname,
                email,
                phone,
                subject,
                content], (err, data) => {
                req.session.Success = "Gửi chủ đề thành công";
                res.redirect("/lien-he");
            })
        });
    }
};

module.exports = controller;