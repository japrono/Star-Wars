import React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CloseIcon from '@material-ui/icons/Close';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

class SearchDialog extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      Name: this.props.Name,
      Fetch_Compete: false,
      Diameter: "",
      Climate: "",
      Population: ""
    }
  }

  async componentDidMount() {
    try {
      var cache_name = "Planet_" + this.props.Planet_ID;
      const item = localStorage.getItem(cache_name);
      var obj = JSON.parse(item);

      this.setState({
        Fetch_Compete: true,
        Diameter: obj.Diameter != "unknown" ? Number(obj.Diameter) : "unknown",
        Climate: obj.Climate,
        Population: obj.Population != "unknown" ? Number(obj.Population) : "unknown"
      });
     }
     catch(ex) {
       console.log(ex);
     }
     finally {

     }





  }

  render() {
    return (
      <div>

      <Dialog open={true} onClose={this.props.HandleDialogClose}>
             <DialogTitle style={{backgroundColor:"WhiteSmoke"}}>
             <div id="DialogTitleContent">
               <div className="noselect">{this.props.Name}</div>
               <div className="CloseIconContainer"> <CloseIcon onClick={this.props.HandleDialogClose} className="CloseIcon" /> </div>
             </div>
             </DialogTitle>


             <DialogContent style={{display: this.state.Fetch_Compete ? "block" : 'none', marginTop:'15px'}}>
               <DialogContentText>
               <table  className="noselect">
                 <tr><td style={{textAlign:'right', paddingRight:'25px'}}><b>Diameter</b></td> <td> {this.state.Diameter.toLocaleString()} </td> </tr>
                 <tr><td style={{textAlign:'right', paddingRight:'25px'}}><b>Climate</b></td><td> {this.state.Climate} </td></tr>
                 <tr><td style={{textAlign:'right', paddingRight:'25px'}}> <b>Population</b></td><td> {this.state.Population.toLocaleString()} </td></tr>
               </table>

               </DialogContentText>
             </DialogContent>

             <div style={{display: !this.state.Fetch_Compete ? 'flex' : 'none', minWidth:'150px', minHeight:'110px'}}>
              <Box sx={{position:'absolute', display:'inline-flex', left:'calc(50% - 15px)', top:'calc(100% - 74px)'}} >
                <CircularProgress size={"25px"}/>
              </Box>
             </div>
           </Dialog>
      </div>
    );
  }


}

export default SearchDialog;
