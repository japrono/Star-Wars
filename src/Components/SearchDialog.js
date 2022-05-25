import React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CloseIcon from '@material-ui/icons/Close';

class SearchDialog extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      Name: this.props.Name
    }
  }

  render() {
    return (
      <div>
      <Dialog open={true} onClose={this.props.HandleDialogClose}>
             <DialogTitle style={{backgroundColor:"WhiteSmoke"}}>
             <div id="DialogTitleContent">
               <div className="noselect">Search</div>
               <div className="CloseIconContainer"> <CloseIcon onClick={this.props.HandleDialogClose} className="CloseIcon" /> </div>
             </div>
             </DialogTitle>


             <DialogContent style={{marginTop:'15px'}}>
               <DialogContentText>
                 <span className="noselect"> Enter the Star Wars name that you want to find below. </span>
               </DialogContentText>
               <TextField
                 className="noselect"
                 margin="dense"
                 id="name"
                 label="Star Wars name"
                 value={this.state.Name}
                 fullWidth
                 onChange={(e) => this.setState({Name: e.target.value})}
               />
             </DialogContent>
             <div style={{backgroundColor:"WhiteSmoke", display:`inline-flex`}}>
             <DialogActions style={{  justifyContent: "flex-start" }}>
               <Button style={{color:'black', textTransform:'none'}} onClick={(e) => this.props.ApplyFilter(``)}>Clear</Button>
              </DialogActions>

              <DialogActions style={{marginLeft:`auto`, float:`right`, clear: `both`}}>
               <Button style={{color:'black', textTransform:'none'}} onClick={this.props.HandleDialogClose}>Cancel</Button>
               <Button style={{color:'black', textTransform:'none'}} onClick={(e) => this.props.ApplyFilter(this.state.Name)}>Search</Button>
             </DialogActions>
             </div>
           </Dialog>
      </div>
    );
  }


}

export default SearchDialog;
