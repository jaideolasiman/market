const User = require('../../models/user');
const Order = require('../../models/order');
const AuctionSession = require('../../models/auctionSession');
const moment = require('moment');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const SITE_TITLE = 'PAO';

module.exports.index = async (req, res) => {
    try {
        const userLogin = await User.findById(req.session.login);
        if (!userLogin) {
            req.flash('error', 'Please log in first.');
            return res.redirect('/login');
        }

        // Get current month and year
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const startOfYear = moment().startOf('year').toDate();
        const endOfYear = moment().endOf('year').toDate();


        // Calculate total monthly sales
        const monthlySales = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalSales: { $sum: "$totalPrice" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const monthlyUsers = await User.aggregate([
            {
                $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalUsers: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get auction sessions per month
        const monthlyAuctionSessions = await AuctionSession.aggregate([
            {
                $match: { createdAt: { $gte: startOfYear, $lte: endOfYear } }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalAuctionSessions: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Convert data into an array with months
        const data = [];
        for (let i = 1; i <= 12; i++) {
            data.push({
                month: moment().month(i - 1).format('MMMM'),
                totalSales: monthlySales.find(s => s._id === i)?.totalSales || 0,
                totalUsers: monthlyUsers.find(u => u._id === i)?.totalUsers || 0,
                totalAuctionSessions: monthlyAuctionSessions.find(a => a._id === i)?.totalAuctionSessions || 0,
            });
        }

        // Calculate grand totals
        const totalSalesAll = data.reduce((sum, item) => sum + item.totalSales, 0);
        const totalUsersAll = data.reduce((sum, item) => sum + item.totalUsers, 0);
        const totalAuctionSessionsAll = data.reduce((sum, item) => sum + item.totalAuctionSessions, 0);

        const totalMonthlySales = monthlySales.length > 0 ? monthlySales[0].totalSales : 0;
          // Get total users count
          const totalUsers = await User.countDocuments();

        const totalAuctionSessions = await AuctionSession.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        res.render('admin/index.ejs', {
            site_title: SITE_TITLE,
            title: 'Home',
            req: req,
            messages: req.flash(),
            userLogin: userLogin,
            currentUrl: req.originalUrl,
            totalUsers: totalUsers,
            monthlySales: totalMonthlySales, // Pass the data to EJS
            totalAuctionSessions: totalAuctionSessions, // Pass auction sessions count
            startOfYear,
            endOfYear,
            data: data,
            monthlyUsers,
            monthlyAuctionSessions,
            totalSalesAll,
            totalUsersAll,
            totalAuctionSessionsAll
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        req.flash('error', 'Something went wrong.');
        res.redirect('/login');
    }
};

module.exports.generateReport = async (req, res) => {
    try {
        // Fetch necessary data
        const totalUsers = await User.countDocuments();
        const totalSales = await Order.aggregate([
            { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } }
        ]);
        const totalAuctionSessions = await AuctionSession.countDocuments();

        const totalSalesValue = totalSales.length > 0 ? totalSales[0].totalSales : 0;

        // Get current date and time
        const now = new Date();
        const formattedDate = now.toLocaleString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit', 
            hour12: true 
        });

        // Get detailed monthly data
        const currentYear = now.getFullYear();
        const monthlySales = await Order.aggregate([
            {
                $match: { createdAt: { $gte: new Date(currentYear, 0, 1), $lte: new Date(currentYear, 11, 31) } }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalSales: { $sum: "$totalPrice" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const monthlyUsers = await User.aggregate([
            {
                $match: { createdAt: { $gte: new Date(currentYear, 0, 1), $lte: new Date(currentYear, 11, 31) } }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalUsers: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const monthlyAuctionSessions = await AuctionSession.aggregate([
            {
                $match: { createdAt: { $gte: new Date(currentYear, 0, 1), $lte: new Date(currentYear, 11, 31) } }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    totalAuctionSessions: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Convert data to an array format for Excel
        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const data = months.map((month, index) => ({
            month,
            totalSales: monthlySales.find(s => s._id === index + 1)?.totalSales || 0,
            totalUsers: monthlyUsers.find(u => u._id === index + 1)?.totalUsers || 0,
            totalAuctionSessions: monthlyAuctionSessions.find(a => a._id === index + 1)?.totalAuctionSessions || 0
        }));

        // Create an Excel workbook and sheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Marketplace Report');

        // Define file path
        const reportsDir = path.join(__dirname, '../../public/reports');
        const filePath = path.join(reportsDir, 'Marketplace_Report.xlsx');

        // Ensure directory exists
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        // Add summary section before the table
        worksheet.addRow(['Generated on:', formattedDate]);
        worksheet.addRow(['Total Users:', totalUsers]);
        worksheet.addRow(['Total Sales (₱):', totalSalesValue.toLocaleString()]);
        worksheet.addRow(['Total Auction Sessions:', totalAuctionSessions]);
        worksheet.addRow([]); // Blank row for spacing

        // Add table header row
        const headerRow = worksheet.addRow(['Month', 'Total Sales (₱)', 'Total Users', 'Total Auction Sessions']);
        headerRow.font = { bold: true };

        // Add data rows
        data.forEach(item => {
            worksheet.addRow([item.month, item.totalSales, item.totalUsers, item.totalAuctionSessions]);
        });

        // Add summary row at the bottom
        worksheet.addRow([]);
        const totalRow = worksheet.addRow([
            'TOTAL',
            data.reduce((sum, item) => sum + item.totalSales, 0),
            data.reduce((sum, item) => sum + item.totalUsers, 0),
            data.reduce((sum, item) => sum + item.totalAuctionSessions, 0)
        ]);
        totalRow.font = { bold: true };

        // Adjust column widths for better readability
        worksheet.columns = [
            { key: 'month', width: 15 },
            { key: 'totalSales', width: 20 },
            { key: 'totalUsers', width: 15 },
            { key: 'totalAuctionSessions', width: 25 }
        ];

        // Write the file
        await workbook.xlsx.writeFile(filePath);

        // Send the file for download
        res.download(filePath, 'Marketplace_Report.xlsx', (err) => {
            if (err) {
                console.error('Download error:', err);
                req.flash('error', 'Failed to generate report.');
                res.redirect('/admin');
            }
        });

    } catch (error) {
        console.error('Error generating report:', error);
        req.flash('error', 'Failed to generate report.');
        res.redirect('/admin');
    }
};