// import reportWebVitals from 'src/reportWebVitals';
import React, { Component } from 'react';
import './App.css';
// import Web3 from 'web3';
import Navbar from './Navbar'
import Content from './Content'
import { connect } from 'react-redux'
import 
{ 
  loadWeb3, 
  loadAccount, 
  loadToken, 
  loadExchange 
} 
  from '../store/interactions'
import { contractsLoadedSelector } from '../store/selectors'







class App extends Component {
  componentDidMount() {
    this.loadBlockChainData(this.props.dispatch)

  }

  async loadBlockChainData(dispatch) {
    const web3 = loadWeb3(dispatch)
    await web3.eth.net.getNetworkType()
    const networkId = await web3.eth.net.getId()
    await loadAccount(web3, dispatch)
    // const abi =  await Token.abi
    // const address = await Token.networks[networkId].address
    const token = await loadToken(web3, networkId, dispatch)
    if(!token) {
      window.alert('Token Contract not detected with the current network. Please select another network with Metamask.')
      return
    }
    const exchange = await loadExchange(web3, networkId, dispatch)
    if(!exchange) {
      window.alert('Exchange Contract not detected with the current network. Please select another network with Metamask.')
      return
    }

  }


  render() {
    return (
      <div>
        <Navbar/>
        { this.props.contractsLoaded ? <Content/> : <div className='content'></div>}
        
      </div>
    );
  }
}



function mapStateToProps(state) {
  return {
    contractsLoaded: contractsLoadedSelector(state)

  }
}

export default connect(mapStateToProps)(App);
