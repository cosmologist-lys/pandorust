use crate::parts::{CleanResult, ProjectCleanserRespond};
use pandorust_core::custom_err::PanError;

pub mod logic;
pub mod parts;

pub fn scan_projects(
    root_path: &str,
    target_type: &str,
) -> Result<ProjectCleanserRespond, PanError> {
    logic::scan_projects(root_path, target_type)
}

pub fn remove_targets(targets: Vec<CleanResult>) -> Result<ProjectCleanserRespond, PanError> {
    logic::clean_junk(targets)
}
