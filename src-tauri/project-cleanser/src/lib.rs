use pandorust_core::custom_err::PanError;
use crate::parts::{CleanResult, ProjectCleanserRespond};

pub mod parts;
pub mod logic;

pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}


pub fn scan_projects(root_path: &str, target_type: &str) -> Result<ProjectCleanserRespond, PanError> {
    logic::scan_projects(root_path,target_type)
}

pub fn remove_targets(targets: Vec<CleanResult>) -> Result<ProjectCleanserRespond,PanError> {
    logic::clean_junk(targets)
}