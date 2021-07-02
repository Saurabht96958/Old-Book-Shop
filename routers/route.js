const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { check, validationResult, Result } = require("express-validator");
const { route } = require("./addProduct");

// Home Page
router.get("/home", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM books");
        if (!result) {
            console.log("Error occur selecting query");
            return res.redirect("/addproduct");
        }

        let allBooks = result.rows;

        if (req.session.loggedIn) {
            const userStatus = {
                loggedIn: req.session.loggedIn,
                username: req.session.fullName,
                userid: req.session.userid
            };

            return res.render("home", { allBooks, userStatus });
        }
        return res.render("home", { allBooks, userStatus: "" });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: "Server Error" });
    }
});

// Login Page

router.get("/login", (req, res) => {
    res.render("login", { msg: "" });
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    // console.log(req.body);

    if (!email || !password) {
        // console.log('error');
        return res.render("login", { msg: "invalid email or password" });
    }

    const logResult = await pool.query("SELECT * FROM users where email=($1)", [
        email,
    ]);

    if (password === logResult.rows[0].password) {
        //    console.log(logResult.rows[0].fullname)
        req.session.loggedIn = true;
        req.session.userid = logResult.rows[0].id;
        req.session.fullName = logResult.rows[0].fullname;
        req.session.email = logResult.rows[0].email;

        return res.redirect("/home");
    }
    return res.render("login", { msg: "invalid email or password" });
});

//Logout Page
router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/home");
});

// Register Page

router.get("/register", (req, res) => {
    res.render("register", { msg: "" });
});

//@ POST /register
router.post(
    "/register",
    [
        check("fullName", "Full Name is required").not().isEmpty(),
        check("phoneNumber", "Phone number is required").not().isEmpty(),
        check("address", "address is required").not().isEmpty(),
        check("city", "City is required").not().isEmpty(),
        check("state", "State is required").not().isEmpty(),
        check("country", "Country is required").not().isEmpty(),
        check("email", "Email is required").isEmail(),
        check("password", "Password should be min: 6").isLength({ min: 6 }),
    ],
    async (req, res) => {
        try {
            const {
                fullName,
                phoneNumber,
                address,
                city,
                state,
                country,
                email,
                password,
            } = req.body;
            const errors = validationResult(req);

            let arr = [];
            errors.errors.forEach((element) => {
                // console.log(element.msg)
                arr.push(element.msg);
            });
            console.log(arr);

            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            //finding existing user
            const oldUser = await pool.query("SELECT * FROM users WHERE email=($1)", [
                email,
            ]);
            // console.log('oldUser: ',oldUser);
            if (oldUser.rows.length > 0) {
                //console.log('User already exist');
                arr.push("Email is already registered!");
                return res.render("register", { msg: "Email is already registered!" });
            }

            const newUser = await pool.query(
                "INSERT INTO users(fullName,phoneNumber,address,city,state,country,email,password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)RETURNING *",
                [fullName, phoneNumber, address, city, state, country, email, password]
            );

            return res.render("register", { msg: "Registration successfully!" });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ msg: "Server Error" });
        }
    }
);

// Details Page
router.get("/details/:id", async (req, res) => {
    try {
        if (req.session.loggedIn) {
            const userStatus = {
                loggedIn: req.session.loggedIn,
                username: req.session.fullName,
                userid: req.session.userid
            };
        const result = await pool.query("SELECT * FROM books where bookid=$1", [
            req.params.id,
        ]);
        if (!result) {
            console.log("Error occur selecting query");
            return res.redirect("/home");
        }
        // console.log(result.rows[0]);

        const temp = result.rows[0];

        const detail = {
            id: temp.bookid,
            title: temp.title,
            category: temp.category,
            author: temp.author,
            publisher: temp.publisher,
            price: temp.price,
            description: temp.description,
            img: temp.img,
            contenttype: temp.contenttype,
        };

        if (req.session.loggedIn) {
            const data = {
                loggedIn: req.session.loggedIn,
                username: req.session.fullName,
            };

            res.render("details", { detail, userStatus, info:"" });
        }
        // console.log("detail---", detail);
    }
    return res.redirect('/login');
         
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: "Server Error" });
    }
});

//Dashboard GET /dashborad

router.get("/dashboard", async (req, res) => {
    try {
        if(!req.session.loggedIn){
            return res.redirect('/login');
        }
        const userid = req.session.userid;
        const result = await pool.query("SELECT * FROM books where userid=$1", [
            userid,
        ]);

        if (!result) {
            console.log("Error occur selecting query");
            return res.redirect("/home");
        }

        const temp = result.rows;

        res.render("./Dashboard/dashboard", { temp, counter: 1 });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

//Cart Page GET /cart

router.get("/cart", async (req, res) => {

    try {

        if (req.session.loggedIn) {
            const userStatus = {
                loggedIn: req.session.loggedIn,
                username: req.session.fullName,
                userid: req.session.userid
            };
            const userid = req.session.userid;
            const result = await pool.query('SELECT * FROM carts where userid=$1', [userid]);
            const data = result.rows;
            // console.log(data);

            res.render("cart", { data, userStatus });

        }

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: "Server Error" });
    }

});


//Adding to the Cart  POST /cart/:bookid/:bookid

router.post("/cart/:title/:price/:bookid", async (req, res) => {
    try {
        if (req.session.loggedIn) {
            const userStatus = {
                loggedIn: req.session.loggedIn,
                username: req.session.fullName,
                userid: req.session.userid
            };
            const { title, price, bookid } = req.params;
            const userid = req.session.userid;

            const result = await pool.query("SELECT * FROM books where bookid=$1", [
                bookid,
            ]);
            if (!result) {
                console.log("Error occur selecting query");
                return res.redirect("/home");
            }
            // console.log(result.rows[0]);

            const temp = result.rows[0];

            const detail = {
                id: temp.bookid,
                title: temp.title,
                category: temp.category,
                author: temp.author,
                publisher: temp.publisher,
                price: temp.price,
                description: temp.description,
                img: temp.img,
                contenttype: temp.contenttype,
            };

            
            // console.log("detail---", detail);
            const already = await pool.query('SELECT * FROM carts where userid=$1 AND bookid=$2', [userid, req.params.bookid]);

            if (already.rows.length > 0) {
                return res.render("details", { detail, info: "Already Added!", userStatus });
            }

            const result1 = await pool.query('INSERT INTO carts(title, price, bookid, userid) values ($1,$2,$3,$4)', [title, price, bookid, userid]);
            if (!result1) {
                console.log("Something went wrong while adding into the Cart!");
                return res.redirect('/home');
            }

            res.render("details", { detail, info: "Added to Cart Successfully", userStatus });

        }

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: "Server Error" });
    }


});


// Remove From Cart DELETE /cart/:cartid
router.delete('/cart/:cartid', async (req, res) => {
    try {
        if (req.session.loggedIn) {
            const userStatus = {
                loggedIn: req.session.loggedIn,
                username: req.session.fullName,
                userid: req.session.userid
            };
            const result = await pool.query('DELETE FROM carts WHERE cartid=$1', [req.params.cartid]);
            if (!result) {
                console.log('Something went wrong while romoving items from cart');
                return res.redirect('/cart');
            }
            console.log('Succesfully removed item from cart');
            return res.redirect('/cart');
        }
        return res.redirect('/login');
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: "Server Error" });
    }
});

// Contact Page GET /contact/:bookid

router.get("/contact/:bookid", async (req, res) => {
    try {
        if (req.session.loggedIn) {
            const userStatus = {
                loggedIn: req.session.loggedIn,
                username: req.session.fullName,
                userid: req.session.userid
            };
            const bookResult = await pool.query('SELECT userid FROM books WHERE bookid=$1', [req.params.bookid]);

            const userId = bookResult.rows[0].userid;
            const userResult = await pool.query('SELECT * FROM users WHERE id=$1', [userId]);




            res.render("contact", { data: userResult.rows[0], userStatus });
        } else {
            return res.redirect('/login');
        }
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: "Server Error" });
    }

});

 
//Profile GET /profile/:id

router.get("/profile/:id", async (req, res) => {
    try {
       
        if (req.session.loggedIn) {
            const userStatus = {
                loggedIn: req.session.loggedIn,
                username: req.session.fullName,
                userid: req.session.userid
            };
            const result = await pool.query("SELECT * From users where id=$1", [
                req.params.id
            ]);
            // console.log(result.rows[0]);
            const data = result.rows[0];
            return res.render("profile", { data, userStatus });
        }
        return res.redirect('/login');

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

//Edit Profile Page GET /editprofile/:id

router.get("/editprofile/:id", async (req, res) => {
    try {
        if (req.session.loggedIn) {
            const userStatus = {
                loggedIn: req.session.loggedIn,
                username: req.session.fullName,
                userid: req.session.userid
            };
            const result = await pool.query("SELECT * From users where id=$1", [
                req.params.id]);
            
            const data = result.rows[0];

            return res.render("editProfile", { data, msg: '', userStatus });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

//Edit Profile Page POST /editprofile/:id

router.put('/editprofile/:id', async (req, res) => {

    try {

        if (req.session.loggedIn) {
            const userStatus = {
                loggedIn: req.session.loggedIn,
                username: req.session.fullName,
                userid: req.session.userid
            };

            const { fullName, phoneNumber, address, city, state, country } = req.body;

            const data = {
                fullname: fullName.trim(),
                phonenumber: phoneNumber.trim(),
                address: address.trim(),
                city: city.trim(),
                state: state.trim(),
                country: country.trim()
            };
             

            if (!data.fullname || !data.phonenumber || !data.address || !data.city || !data.state || !data.country) {
                return res.render('editprofile', { data, userStatus, msg: "Fill all the fields!" });
            }

            console.log(req.body)


            const result = await pool.query('UPDATE users SET fullname=$1, phonenumber=$2, address=$3, city=$4, state=$5,country=$6 WHERE id=$7  ', [fullName, phoneNumber, address, city, state, country, req.params.id]);
            if (result) {
                const result = await pool.query('SELECT * FROM users WHERE  id=$1', [req.params.id]);
                const data = result.rows[0];
                return res.render('editprofile', { data, userStatus, msg: "Updated successfully!" });
            }
        }
        // ------------------

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server Error" });
    }
});

module.exports = router;
