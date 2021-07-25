const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");


const app = express();


app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/newTodoDB", { useNewUrlParser: true, useUnifiedTopology: true });

const itemSchema = new mongoose.Schema({
    name: String
});


const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "welcome to your ToDoList"
});

const item2 = new Item({
    name: "+ to add item"
});

const item3 = new Item({
    name: "<-- use to remove item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
    Item.find({}, function(err, foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("successfully inserted default items to DB.");
                }
                res.redirect("/");
            });
        } else {
            res.render("list", { listTitle: "Today", listItems: foundItems });
        }
    })

});

app.get("/:topic", function(req, res) {
    const customListName = _.upperFirst(req.params.topic);
    List.findOne({ name: customListName }, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                const newList = new List({
                    name: customListName,
                    items: defaultItems
                });
                newList.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", { listTitle: customListName, listItems: foundList.items });
            }
        }
    });
});


app.post("/", function(req, res) {
    const listItem = req.body.listItem;
    const currentPage = req.body.listBtn;

    const newListItem = new Item({
        name: listItem
    });

    if (currentPage === "Today") {
        newListItem.save();
        res.redirect("/");
    } else {
        List.findOne({ name: currentPage }, function(err, foundList) {
            if (!err) {
                foundList.items.push(newListItem);
                foundList.save();
                res.redirect("/" + currentPage)
            }
        });
    }
});





app.post("/delete", function(req, res) {
    const checkedItem = req.body.checkboxItemId;
    const currentPage = req.body.currentPageTitle;

    if (currentPage === "Today") {
        Item.findByIdAndRemove(checkedItem, function(err) {
            if (!err) {
                console.log("successfully deleted item.");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({ name: currentPage }, { $pull: { items: { _id: checkedItem } } }, function(err, foundList) {
            if (!err) {
                res.redirect("/" + currentPage);
            }
        });
    }
});







app.listen(3000, function() {
    console.log("port running on port 3000.");
});