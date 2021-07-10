import React from 'react'


export  const Spinner = (props) => {
	if (props.type === 'table') {
		return(<tbody className= 'spinner-border text-light text-center'></tbody>)
	} else {
		return(<div className="spinner-border text-light text-center"> </div>)
	}
}