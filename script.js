var db = openDatabase("GraphDB", "1.0", "Graph Database", 1024 * 1024)

$(function () {

    // Model
    // ----------

    var GraphNodeModel = Backbone.Model.extend({
        defaults: function () {
            return {
                type: "GraphNode",
                xCoord: 100,
                yCoord: 100,
                name: "Node Name",
                image: ""
            };
        },
    }),
        GraphLineModel = Backbone.Model.extend({
            defaults: function () {
                return {
                    type: "GraphLine",
                    x1Coord: 200,
                    y1Coord: 200,
                    x2Coord: 400,
                    y2Coord: 200
                };
            },
        }),
        GraphAttrModel = Backbone.Model.extend({
            defaults: function () {
                return {
                    type: "GraphAttr",
                    xCoordMax: 400,
                    yCoordMax: 400
                };
            },
        });

    // Collection
    // ---------------

    var GraphPage = Backbone.Collection.extend({
        model: function (model, options) {
            switch (model.type) {
                case "GraphNode":
                    return new GraphNodeModel(model, options);
                case "GraphLine":
                    return new GraphLineModel(model, options);
                case "GraphAttr":
                    return new GraphAttrModel(model, options);
            }
        },
        graphAttrs: null,
        store: new WebSQLStore(db, "GraphTable"),
    });

    var GraphDisp = new GraphPage;

    // Item View
    // --------------

    var GraphNodeView = Backbone.View.extend({
        template: _.template($('#graph-node-template').html()),
        tagName: "div",
        className: "graph-node",
        events: {
            "mousedown": "mouseDownHandler",
            "touchstart": "mouseDownHandler"
        },
        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
            this.listenTo(this.model, 'destroy', this.remove);
        },
        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.css({ top: this.model.attributes.yCoord + "px", left: this.model.attributes.xCoord + "px" });
            return this;
        },
        clear: function () {
            this.model.destroy();
        },
        dragRelPosX: 0,
        dragRelPosY: 0,
        mouseDownHandler: function (e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            this.dragRelPosX = e.clientX;
            this.dragRelPosY = e.clientY;
            this.delegateEvents($.extend(this.events, {
                "mouseup": "closeDragElement",
                "mousemove": "elementDrag",
                "touchend": "closeDragElement",
                "touchmove": "elementDrag"
            }))

        },
        elementDrag: function (e) {
            var posX, posY, offset;
            e = e || window.event;
            e.preventDefault();
            e = (e.changedTouches && e.changedTouches[0]) || e;
            // calculate the new cursor position:
            posX = this.dragRelPosX - e.clientX;
            posY = this.dragRelPosY - e.clientY;
            this.dragRelPosX = e.clientX;
            this.dragRelPosY = e.clientY;
            offset = this.$el.offset()
            this.$el.css({ top: (offset.top - posY) + "px", left: (offset.left - posX) + "px" });
        },
        roundNearest10: function (num) {
            return (Math.round(num / 10) * 10)
        },
        closeDragElement: function (e) {
            var posX, posY, offset;
            this.$el.off("mouseup")
            this.$el.off("mousemove")
            this.$el.off("touchend")
            this.$el.off("touchmove")

            e = (e.changedTouches && e.changedTouches[0]) || e;
            posX = this.dragRelPosX - e.clientX;
            posY = this.dragRelPosY - e.clientY;
            offset = this.$el.offset()
            posX = this.roundNearest10(offset.left - posX)
            posY = this.roundNearest10(offset.top - posY)
            this.$el.css({ top: posY + "px", left: posX + "px" });

            this.model.save({ yCoord: posY, xCoord: posX })
        }
    }),
        GraphLineView = Backbone.View.extend({
            events: {
            },
            className: "graph-line",
            preinitialize: function (options) {
                _.extend(this, _.pick(options, ["svgElement"]));
            },
            _createElement: function (tagName) {
                var arrow = this.svgElement.polygon([5, 0, 0, 2, 5, 4, 5, 0]).attr({ fill: '#000' });
                var marker = arrow.marker(0, 0, 5, 4, 1, 2); //(x, y, width, height, refX, refY) 
                return this.svgElement.line(0, 0, 0, 0).attr({
                    stroke: "black",
                    strokeWidth: 3,
                    markerStart: marker
                })
            },
            _setElement: function (el) {
                this.el = el;
            },
            _setAttributes: function (attributes) {
                this.el.attr(attributes);
            },
            delegateEvents: function () {
            },
            initialize: function () {
                this.listenTo(this.model, 'change', this.render);
                this.listenTo(this.model, 'destroy', this.remove);

                this.el.drag(this.elementDrag, this.dragStartHandler, this.closeDragElement, this, this, this);
                this.el.touchstart(this.dragStartHandler, this)
                this.el.touchmove(this.elementDrag, this)
                this.el.touchend(this.closeDragElement, this)
            },
            render: function () {
                this.el.attr({
                    x1: this.model.attributes.x1Coord,
                    y1: this.model.attributes.y1Coord,
                    x2: this.model.attributes.x2Coord,
                    y2: this.model.attributes.y2Coord,
                })
                return this;
            },
            clear: function () {
                this.model.destroy();
            },
            dragAnchor: null,
            dragStartX: null,
            dragStartY: null,
            roundNearest10: function (num) {
                return (Math.round(num / 10) * 10)
            },
            dragStartHandler: function (startX, startY, e) {
                var x1 = this.model.attributes.x1Coord,
                    y1 = this.model.attributes.y1Coord,
                    x2 = this.model.attributes.x2Coord,
                    y2 = this.model.attributes.y2Coord,
                    xLen = Math.abs(x2 - x1),
                    yLen = Math.abs(y2 - y1),
                    grabMargin = 30;
                
                    if( (typeof startX == 'object') && ( startX.type == 'touchstart') ) {
                        startX.preventDefault();
                        e = startX.changedTouches[0]
                        startX = e.clientX
                        startY = e.clientY
                    }
                if (yLen > xLen) {
                    var y1Dist = Math.abs(y1 - startY),
                        y2Dist = Math.abs(y2 - startY);
                    if (y1Dist > y2Dist) {
                        this.dragAnchor = (y2Dist < grabMargin ? 1 : 0)
                    } else {
                        this.dragAnchor = (y1Dist < grabMargin ? 2 : 0)
                    }
                } else {
                    var x1Dist = Math.abs(x1 - startX),
                        x2Dist = Math.abs(x2 - startX);
                    if (x1Dist > x2Dist) {
                        this.dragAnchor = (x2Dist < grabMargin ? 1 : 0)
                    } else {
                        this.dragAnchor = (x1Dist < grabMargin ? 2 : 0)
                    }
                }
                this.dragStartX = e.clientX
                this.dragStartY = e.clientY
            },
            elementDrag: function (dx, dy, posX, posY, e) {
                if( (typeof dx == 'object') && ( dx.type == 'touchmove') ) {
                    e = dx.changedTouches[0]
                    dx = e.clientX - this.dragStartX
                    dy = e.clientY - this.dragStartY
                }
                switch (this.dragAnchor) {
                    case 0:
                        this.el.attr({
                            x1: this.model.attributes.x1Coord + dx,
                            y1: this.model.attributes.y1Coord + dy,
                            x2: this.model.attributes.x2Coord + dx,
                            y2: this.model.attributes.y2Coord + dy
                        });
                        break
                    case 1:
                        this.el.attr({
                            x2: this.model.attributes.x2Coord + dx,
                            y2: this.model.attributes.y2Coord + dy
                        });
                        break
                    case 2:
                        this.el.attr({
                            x1: this.model.attributes.x1Coord + dx,
                            y1: this.model.attributes.y1Coord + dy
                        });
                        break
                }
            },
            closeDragElement: function (e) {
                var x1 = this.model.attributes.x1Coord,
                    y1 = this.model.attributes.y1Coord,
                    x2 = this.model.attributes.x2Coord,
                    y2 = this.model.attributes.y2Coord;

                e = (e.changedTouches && e.changedTouches[0]) || e;
                switch (this.dragAnchor) {
                    case 0:
                        x1 = this.roundNearest10(x1 + e.clientX - this.dragStartX)
                        y1 = this.roundNearest10(y1 + e.clientY - this.dragStartY)
                        x2 = this.roundNearest10(x2 + e.clientX - this.dragStartX)
                        y2 = this.roundNearest10(y2 + e.clientY - this.dragStartY)
                        break
                    case 1:
                        x2 = this.roundNearest10(x2 + e.clientX - this.dragStartX)
                        y2 = this.roundNearest10(y2 + e.clientY - this.dragStartY)
                        break
                    case 2:
                        x1 = this.roundNearest10(x1 + e.clientX - this.dragStartX)
                        y1 = this.roundNearest10(y1 + e.clientY - this.dragStartY)
                        break
                }
                this.el.attr({ x1: x1, y1: y1, x2: x2, y2: y2 });
                this.model.save({ x1Coord: x1, y1Coord: y1, x2Coord: x2, y2Coord: y2 })
            }
        }),
        GraphAttrView = Backbone.View.extend({
            initialize: function () {
                this.listenTo(this.model, 'change', this.render);
            },
            render: function () {
                $("#graph-main-div").css({ width: this.model.attributes.xCoordMax + "px", height: this.model.attributes.yCoordMax + "px" });
                return this;
            }
        });

    // The Application
    // ---------------

    var AppView = Backbone.View.extend({
        el: $("#graph-sidebar"),
        events: {
            "click #graph-add-node": "createNewNode",
            "click #graph-add-line": "createNewLine",
            "click #graph-inc-width": "increaseGraphWidth",
            "click #graph-inc-height": "increaseGraphHeight",
            "click #graph-dec-width": "decreaseGraphWidth",
            "click #graph-dec-height": "decreaseGraphHeight"
        },
        initialize: function () {
            this.graphMainDiv = $("#graph-main-div");
            this.graphSvg = Snap("#graph-lines-svg");
            this.listenTo(GraphDisp, 'add', this.addOne);

            GraphDisp.fetch({
                success: function (collection, response, options) {
                    if (!collection.graphAttrs) {
                        collection.create({ type: "GraphAttr" })
                    }
                }
            });
        },
        createNewNode: function (e) {
            GraphDisp.create({ type: "GraphNode" })
        },
        createNewLine: function (e) {
            GraphDisp.create({ type: "GraphLine" })
        },
        graphMainDiv: null,
        graphSvg: null,
        addOne: function (graphModel) {
            var view
            switch (graphModel.attributes.type) {
                case "GraphNode":
                    view = new GraphNodeView({ model: graphModel });
                    this.graphMainDiv.append(view.render().el)
                    break
                case "GraphLine":
                    view = new GraphLineView({ model: graphModel, svgElement: this.graphSvg });
                    view.render()
                    break
                case "GraphAttr":
                    view = new GraphAttrView({ model: graphModel })
                    GraphDisp.graphAttrs = graphModel
                    this.$el.append(view.render().el)
                    break
            }
        },
        increaseGraphWidth: function (e) {
            if (!GraphDisp.graphAttrs) return;
            GraphDisp.graphAttrs.save({ xCoordMax: (GraphDisp.graphAttrs.attributes.xCoordMax + 100) })
        },
        increaseGraphHeight: function (e) {
            if (!GraphDisp.graphAttrs) return;
            GraphDisp.graphAttrs.save({ yCoordMax: (GraphDisp.graphAttrs.attributes.yCoordMax + 100) })
        },
        decreaseGraphWidth: function (e) {
            if (!GraphDisp.graphAttrs) return;
            GraphDisp.graphAttrs.save({ xCoordMax: (GraphDisp.graphAttrs.attributes.xCoordMax - 100) })
        },
        decreaseGraphHeight: function (e) {
            if (!GraphDisp.graphAttrs) return;
            GraphDisp.graphAttrs.save({ yCoordMax: (GraphDisp.graphAttrs.attributes.yCoordMax - 100) })
        },
    });

    var App = new AppView;

});
