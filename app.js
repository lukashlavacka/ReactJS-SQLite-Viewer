var Table = React.createClass({
	render: function() {
		return (
			<BootstrapRow>			
				<p className="info">Found {this.props.data.values.length || 0} record(s)</p>
				<div className="table-responsive">
					<table className="table table-striped table-hover">
						<Head columns={this.props.data.columns} handleSortChange={this.props.handleSortChange} />
						<Body rows={this.props.data.values} />			
					</table>
				</div>
			</BootstrapRow>
		);
	}
})

var Head = React.createClass({
	handleSortChange: function(column, event) {
		event.preventDefault();
		this.props.handleSortChange(column)	
	},
	render: function() {
		return (
			<thead>
				<tr>
					{this.props.columns.map(function(column){
						return <th key={column}><a href="#" onClick={this.handleSortChange.bind(null, column)}>{column}</a></th>
					}.bind(this))}
				</tr>
			</thead>
		);
	}
})

var Body = React.createClass({
	render: function() {
		return (
			<tbody>
				{this.props.rows.map(function(r, i){
					return <Row key={i} values={r}/>
				}.bind(this))}
			</tbody>
		);
	}
})

var Row = React.createClass({
	render: function() {
		return (
			<tr>
				{this.props.values.map(function(v, i){
					return <td key={i}>{ v }</td>
				}.bind(this))}			
			</tr>
		);
	}
})

var BootstrapRow = React.createClass({
	render: function() {
		return (
			<div className="row">
				<div className="col-xs-12">
					{this.props.children}
				</div>
			</div>
		);
	}
})

var TableSource = React.createClass({
	handleChange: function(event)
	{
		var table = ReactDOM.findDOMNode(this.refs.table).value
		if(!table)
			return;

		this.props.handleTableChange(table);
	},
	render: function() {
		return (
			<BootstrapRow>
				<form className="form-inline">
					<div className="form-group">
						<label htmlFor="table">Table</label>
						<select className="form-control" id="table" onChange={this.handleChange} ref="table">
							<option value="">Select table</option>
							{this.props.tables.map(function(t){
								return <option key={t} value={t}>{t}</option>
							})}
						</select>
					</div>
				</form>
			</BootstrapRow>
		);
	}
})

var FileDropWrapper = React.createClass({
	onDragEnter : function(event) {
		event.stopPropagation();
		event.preventDefault();
	},
	onDragOver : function(event) {
		event.stopPropagation();
		event.preventDefault();
	},
	onDrop: function(event){
		event.stopPropagation();
		event.preventDefault();

		var dt = event.dataTransfer;
		var files = dt.files;

		if(files && files.length && files[0])
			this.props.handleFileChange(files[0]);
	},
	render: function() {
		return (
			<div style={{ height: "100%" }} onDrop={this.onDrop} onDragEnter={this.onDragEnter} onDragOver={this.onDragOver}>
				{this.props.children}
			</div>
		);
	}
})

var Status = React.createClass({
	render: function() {
		return (
			<BootstrapRow>
			{this.props.status}			
			</BootstrapRow>
		);
	}
})

var Interface = React.createClass({
	queryData: function(state) {
		// debugger;
		var query = "select * from " + state.table;

		if(state.col)
		{
			query += " order by " + state.col;
			if(state.sort)
				query += " desc";
			else
				query += " asc"
		}

		var data = state.db.exec(query)
		return data[0];
	},
	getTables: function(db) {
		// debugger;
		var data = db.exec("select name from sqlite_master WHERE type='table'")
		return data[0].values.map(function(t){ return t[0]});
	},
	handleSortChange: function(col) {
		this.setState(function(previousState){
			// debugger;			
			if(previousState.col === col)
				previousState.sort = !previousState.sort;
			else
				previousState.sort = false;

			previousState.col = col;

			previousState.data = this.queryData(previousState);
		})
	},
	handleTableChange: function(table) {		
			// debugger;
		this.setState(function(previousState){
			previousState.table = table;
			previousState.data = this.queryData(previousState)
		})
	},
	handleDisplayChange: function() {
		this.setState(function(previousState) {
			// debugger;
			if(previousState.table){
				previousState.data = this.queryData(previousState);
			}
		});
	},
	handleFileChange: function(file)
	{
		this.state.status = "Loading";
		var now = new Date();
		var sqlReader = new FileReader();
		sqlReader.onload = function() {
			var Uints = new Uint8Array(sqlReader.result);
			var db = new SQL.Database(Uints);
			this.state.status = "Loaded in " + (new Date() - now) + " miliseconds."
			this.setState(function(previousState) {
				previousState.db = db;
				previousState.tables = this.getTables(db);
				this.handleDisplayChange();				
			});
		}.bind(this);
		sqlReader.readAsArrayBuffer(file);
	},
	getInitialState: function() {
		return {
			data: undefined,
			tables: [],
			table: undefined,
			status: "Drop file"
		}
	},
	render: function() {
		var table;
		if(this.state.data && this.state.data.columns && this.state.data.columns.length)		
			table = <Table data={this.state.data} handleSortChange={this.handleSortChange}/>
		else
			table = <Status status={"No data"} />
		
		return (
			<FileDropWrapper handleFileChange={this.handleFileChange} >
				<Status status={this.state.status} />
				<TableSource tables={this.state.tables} handleTableChange={this.handleTableChange}/>
				{table}
			</FileDropWrapper>
		);
	}
})

ReactDOM.render(
	<Interface />,
	document.getElementById('content')
);