// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    pandorust_lib::run()
    /*let f = quick_find_core::search("C:\\Lys\\software","*.dll");
    match f {
        Ok(r) => {println!("ok : {:?}",r)}
        Err(e) => {println!("error : {}",e)}
    }*/
}
