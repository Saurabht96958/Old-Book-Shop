const express = require('express');
const router = express.Router();
const pool = require("../config/db");
const path = require('path');
const multer = require('multer');
 
const fs = require('fs');

//multer.diskStorage() creates a storage space for storing files.
 
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './routers/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now());
    }
});
 
var upload = multer({ storage: storage });



// Add book GET/addbook
router.get('/addbook', (req, res) => {
    if (req.session.loggedIn) {
        
        return res.render('./Dashboard/addBook')
    }
    return res.redirect('/login');
})


// Add Book page  POST /addbook
router.post('/addbook',upload.single('image'), async(req, res)=>{
    try {                  
         
        const loggeIn = req.session.loggedIn
        if(!loggeIn){
            return res.redirect('/login');
        }


        const { mimetype } =   req.file;
        const contenttype = mimetype;
        const img = fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename));
        const { title, author, publisher, price, category, description} = req.body;
        const userid = req.session.userid
        
        
        const result = await pool.query('INSERT INTO books(title, author, publisher, price, category, description,userid ,contenttype, img) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)RETURNING *',[title, author, publisher, price, category, description,userid ,contenttype, img]);
        if(!result){
             
            console.log('Product not added!');
            return res.redirect('/addproduct', )
        }
        console.log('Product added Successfully');
        return res.redirect('/dashboard');
        
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({msg: 'Server Error'});
    }
});


// Get All products GET/porducts
router.get('/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books');
        if(!result){
            console.log('Error occur selecting query');
            return res.redirect('/addproduct')
        }
        
        let allBooks = result.rows;
       
        res.render('home',{allBooks, data:''})
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({msg: 'Server Error'});
    }
});

//Deleting the Book DELETE /delete/:id

router.delete('/delete/:id', async(req, res) => {
    try {

        const loggedIn = req.session.loggedIn
        if(!loggedIn){
            return res.redirect('/login');
        }
        let cartStatus = await pool.query('SELECT * FROM carts WHERE bookid=$1',[req.params.id]);
        if(cartStatus.rows.length >0){
            cartStatus = await pool.query('DELETE FROM carts WHERE bookid=$1',[req.params.id]);
        }
        const result = await pool.query('DELETE FROM books where bookid=$1',[req.params.id]);  
        // console.log(result);
        res.redirect('/dashboard');
        
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({msg: 'Server Error'});
    }
});
 




//Editing the book details GET /edit/:id

router.get('/editbook/:id', async(req, res) => {
    try {
        if(!req.session.loggedIn){
            return res.redirect('/login');
        }
        const result = await pool.query('SELECT * FROM books WHERE bookid=$1',[req.params.id]);
        const data = result.rows[0];
        // console.log(data);
         
         
        return res.render('./Dashboard/editBook', {data, msg:''});
    } catch (err) {
        console.error(err.message);
        res.status(500).json({msg: 'Server Error'});  
    }
});

//Editing the book details PUT /edit/:id

router.put('/editbook/:id', upload.single("image"), async(req, res) => {
    try {
        // console.log(req.body);
        const loggeIn = req.session.loggedIn;
        if(!loggeIn){
            return res.redirect('/login');
        }
         
        const userid =  req.session.userid;
        if(req.file == null){
            console.log('Hellow world'); 
            const { title, author, publisher, price, category, description} = req.body;  
                
            const result = await pool.query('UPDATE books SET title = $1, author=$2, publisher=$3, price=$4, category=$5, description=$6, userid=$7 WHERE bookid=$8',[title, author, publisher, price, category, description,userid,req.params.id]);
            if(!result){
                // {msg:'fill all the details carefully'}
                console.log('Product not added!');
                return res.redirect('/addproduct', )
            }
        }else {
            const { mimetype } =   req.file;
            const contenttype = mimetype;
            const img = fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename));
            const { title, author, publisher, price, category, description} = req.body;
       
            const result = await pool.query('UPDATE books SET title = $1, author=$2, publisher=$3, price=$4, category=$5, description=$6, userid=$7, contenttype=$8, img=$9 WHERE bookid=$10',[title, author, publisher, price, category, description,userid,contenttype,img,req.params.id])
            if(!result){
                // {msg:'fill all the details carefully'}
                console.log('Product not added!');
                return res.redirect('/addproduct', )
            }
        }
      
        console.log('Product updated Successfully');
        const result = await pool.query('SELECT * FROM books WHERE bookid=$1',[req.params.id]);
        const data = result.rows[0];
        // console.log(data);
         
         
       return res.render('./Dashboard/editBook', {data, msg:'updated successfully'});
        

        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({msg: 'Server Error'});  
    }
     
});




module.exports = router;