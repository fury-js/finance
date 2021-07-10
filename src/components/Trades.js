import React, { Component } from 'react';
import { filledOrdersLoadedSelector, filledOrdersSelector } from '../store/selectors'
import { Spinner }  from './Spinner'

import { connect } from 'react-redux'


const showFilledOrders = (filledOrders) => {
	return (
		<tbody>
	  		{filledOrders.map((order) => {
	  			return (
	  				<tr>
			      			<td>{order.formattedTimestamp}</td>
			      			<td>Otto</td>
			      			<td>@mdo</td>
	    			</tr>
	    		)
	  		})}
	    				
	    </tbody>

	)
}


class Trades extends Component {
	render() {
		return (
		  <div className="vertical">
			<div className="card bg-dark text-white">
	            <div className="card-header">
	                Trades
	            </div>
	            <div className="card-body">
	             	<table className="table table-dark table-sm small">
	  					<thead>
	    					<tr>
	      						<th scope="col">Time</th>
	      						<th scope="col">NEC</th>
	      						<th scope="col">NEC/ETH</th>
	    					</tr>
	  					</thead>
	  					{this.props.filledOrdersLoaded ? showFilledOrders(this.props.filledOrders) : <Spinner type='table'/>}

	  				
	    			</table>
	            </div>
            </div>
          </div>

		)
	}
}


function mapStateToProps(state) {
  return{
  	filledOrdersLoaded: filledOrdersLoadedSelector(state),
  	filledOrders: filledOrdersSelector(state)


  }
}

export default connect(mapStateToProps)(Trades);