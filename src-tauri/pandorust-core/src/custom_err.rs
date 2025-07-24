use thiserror::Error;

#[derive(Error, Debug)]
pub enum PanError {
    #[error("An IO error occurred: {0}")]
    Io(#[from] std::io::Error), // #[from] 自动生成 From<io::Error>
    #[error("Failed to parse an integer: {0}")]
    Parse(#[from] std::num::ParseIntError), // #[from] 自
    #[error("Common-err occurred: '{0}' ")]
    CommonErr(String),
}

#[macro_export]
macro_rules! common_err {
    // 宏的参数签名，和println! format!完全一样
    ($($arg:tt)*) => {
        // 宏展开后的代码：
        // 1. 调用 format! 生成 String
        // 2. 将 String 包裹进 RudoraErr::CommonErr 变体中
        PanError::CommonErr(format!($($arg)*))
    }
}
