var LineChart = window.Chart.React.Line;
var BarChart = window.Chart.React.Bar;

var LineChartComponent = React.createClass({
    getInitialState: function()
    {
        return {
            options : {
                scaleShowGridLines : true,
                responsive: true
            }
        }
    },
    expandDataset: function(data) {
        data.dataset = data.datasets.map(function(d, i) {
            var hue = i * (360 / data.datasets.length)

            d.fillColor             = "hsla(" + hue + ",90%,50%,0.2)";
            d.strokeColor           = "hsla(" + hue + ",90%,50%,1.0)";
            d.pointColor            = "hsla(" + hue + ",90%,50%,1.0)";
            d.pointStrokeColor      = "#fff";
            d.pointHighlightFill    = "#fff";
            d.pointHighlightStroke  = "hsla(" + hue + ",220,220,1.0)";
            return d;
        })
        return data;
    },
    render: function() {
        var data = this.expandDataset(this.props.data)
        return (
            <BootstrapRow>
                <LineChart data={data} options={this.state.options}/>
            </BootstrapRow>
        )
    }
});

var BarChartComponent = React.createClass({
    getInitialState: function()
    {
        return {
            options : {
                scaleShowGridLines : true,
                responsive: true
            }
        }
    },
    expandDataset: function(data) {
        data.dataset = data.datasets.map(function(d, i) {
            var hue = i * (360 / data.datasets.length)

            d.fillColor       = "hsla(" + hue + ",90%,50%,0.5)";
            d.strokeColor     = "hsla(" + hue + ",90%,50%,0.8)";
            d.highlightFill   = "hsla(" + hue + ",90%,50%,0.75)";
            d.highlightStroke = "hsla(" + hue + ",90%,50%,1.0)";
            return d;
        })
        return data;
    },
    render: function() {
        var data = this.expandDataset(this.props.data)
        return (
            <BootstrapRow>
                <BarChart data={data} options={this.state.options}/>
            </BootstrapRow>
        )
    }
});

var ChartColumns = React.createClass({
    getColumns: function() {
        var table = this.props.table;
        var db = this.props.db;

        var query = 'PRAGMA table_info("' + table + '")'
        var data = db.exec(query);
        var columnNames = data[0].values.map(function(t){ return t[1]});
        return columnNames;
    },
    handleChange: function(index, type, event) {
        var series = this.copySeries(this.props.series);
        switch(type)
        {
            case "xField":
                this.props.handleChartColumnsChange(event.target.value, this.props.series);
                return;
            case "yField":
            case "yOperation":
                series[index][type] = event.target.value;
                this.props.handleChartColumnsChange(this.props.xField, series);
                return;
            case "seriesAdd":
                series.splice(index + 1, 0, { yField: this.props.series[index].yField, yOperation: this.props.series[index].yOperation });
                this.props.handleChartColumnsChange(this.props.xField, series);
                return;
            case "seriesRemove":
                series.splice(index, 1);
                this.props.handleChartColumnsChange(this.props.xField, series);
                return;
        }
    },
    componentDidMount: function() {
        this.setState({
            columns: this.getColumns()
        })
    },
    copySeries: function(series){
        return series.map(function(s){
            return {
                yField: s.yField,
                yOperation: s.yOperation
            }
        });
    },
    getInitialState: function() {
        return {
            agregateOperations: [
                "AVG",
                "SUM",
                "MAX",
                "MIN",
                "COUNT"
            ],
            columns: []
        }
    },
    render: function() {
        return (
            <BootstrapRow>
                <form className="form-inline">
                    <div className="form-group">
                        <label className="" htmlFor="xField">X field</label>
                        <select className="form-control input-large" id="xField" value={this.props.xField} onChange={this.handleChange.bind(this, null, "xField")}>
                            <option value="">Select X Field</option>
                            {this.state.columns.map(function(c){
                                return <option key={c} value={c}>{c}</option>
                            })}
                        </select>
                    </div>
                    {this.props.series.map(function(serie, i){
                        return (
                            <div key={i} className="">
                                <div className="form-group">
                                    <label className="" htmlFor={"yField_" + i}>Y field</label>
                                    <select className="form-control input-large" id={"yField_" + i} value={serie.yField} onChange={this.handleChange.bind(this, i, "yField")}>
                                        <option value="">Select Y Field</option>
                                        {this.state.columns.map(function(c){
                                            return <option key={c} value={c}>{c}</option>
                                        })}
                                    </select>
                                </div>                          
                                <div className="form-group">
                                    <label className="" htmlFor={"yOperation_" + i}>Operation</label>
                                    <select className="form-control input-large" id={"yOperation_" + i} value={serie.yOperation} onChange={this.handleChange.bind(this, i, "yOperation")}>
                                        <option value="">Select Operation</option>
                                        {this.state.agregateOperations.map(function(o){
                                            return <option key={o} value={o}>{o}</option>
                                        })}
                                    </select>
                                </div>
                                <div className="btn-group" role="group" aria-label="Basic example">
                                    <button type="button" className="btn btn-danger"  onClick={this.handleChange.bind(this, i, "seriesRemove")} disabled={this.props.series.length < 2}>-</button>
                                    <button type="button" className="btn btn-success" onClick={this.handleChange.bind(this, i, "seriesAdd")}>+</button>
                                </div>
                            </div>
                        )
                    }.bind(this))}
                </form>
            </BootstrapRow>
        );
    }
})

var Chart = React.createClass({
    getQuery: function() {
        var s = squel
            .select()
            .field(this.props.xField);

        for (var i = 0; i < this.props.series.length; i++) {        
             s = s.field(this.props.series[i].yOperation + "(" + this.props.series[i].yField +")")
        };

        s = s
            .order(this.props.xField)
            .from(this.props.table)
            .group(this.props.xField);

        return s.toString();
    },
    transformRawData: function(rawData, query) {
        var data = {
            query: query,
            labels: rawData.values.map(function(v){return v[0]}),
            datasets: []
        }

        for (var i = 0; i < this.props.series.length; i++) {
            data.datasets.push({
                label: rawData.columns[i],
                data: rawData.values.map(function(v){return v[i + 1]})             
            })
        };

        return data;
    },
    getData: function() {
        var query = this.getQuery()
        var now = new Date();
        var data = this.props.db.exec(query);
        var rawData = data[0];
        this.props.handleStatusChange("Last chart query (" + query + ") took " + (new Date() - now) + " miliseconds.", "success")

        return this.transformRawData(rawData, query);
    },
    shouldComponentUpdate: function(nextProps, nextState) {
        if(this.state.type === nextState.type && this.props.xField === nextProps.xField)
        {
            if(this.props.series.length === nextProps.series.length)
            {
                for (var i = 0; i < this.props.series.length; i++) {
                    if(
                            this.props.series[i].yField     !== nextProps.series[i].yField 
                        ||  this.props.series[i].yOperation !== nextProps.series[i].yOperation)
                    {
                        return true;
                    }
                };
                return false;
            }
        }
        return true;
    },
    handleTypeChange: function(type) {
        this.setState({
            type: type
        })
    },
    getInitialState: function() {
        return {
            type: "Line"
        }
    },
    render: function() {
        var data = this.getData()

        var chart;
        if(this.state.type == "Line")
            chart = <LineChartComponent data={data} />
        else
            chart = <BarChartComponent data={data} />

        return (
            <div>
                <ChartType type={this.state.type} handleTypeChange={this.handleTypeChange} />
                {chart}
            </div>
        );
    }
})

var ChartType = React.createClass({
    getInitialState: function() {
        return {
            types: ["Line", "Bar"]
        }
    },
    handleChange: function(event) {
        this.props.handleTypeChange(event.target.value)
    },
    render: function() {      
    return (  
            <BootstrapRow>
                {this.state.types.map(function(t){
                    return (
                        <div key={t} className="radio">
                            <label><input type="radio" checked={this.props.type === t} value={t} onChange={this.handleChange} />{t}</label>
                        </div>
                    )
                }.bind(this))}
            </BootstrapRow>
        )
    }
})

window.ChartViewer = React.createClass({
    handleChartColumnsChange: function(xField, series) {
        this.setState({
            xField : xField,
            series : series
        })
    },
    getInitialState: function() {
        return {
            xField : "",
            series: [
                { yField: "", yOperation: "" }
            ]
        }
    },
    filterSeries: function(series) {
        return _(series)
            .filter(function(s){ return s.yField && s.yOperation })
            .uniqBy(function(s){ return s.yField + "_" + s.yOperation })
            .value()
    },
    render: function() {
        var filteredSeries = this.filterSeries(this.state.series);
        if(this.state.xField && filteredSeries.length)
            var chart = <Chart db={this.props.db} table={this.props.table} xField={this.state.xField} series={filteredSeries} handleStatusChange={this.props.handleStatusChange} />
        return (
            <div>
                <ChartColumns db={this.props.db} table={this.props.table} xField={this.state.xField} series={this.state.series} handleChartColumnsChange={this.handleChartColumnsChange} handleStatusChange={this.props.handleStatusChange} />
                {chart}
            </div>
        )
    }
})