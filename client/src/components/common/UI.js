import React from 'react';

export const Button = ({ children, variant = 'primary', size = 'md', loading, disabled, icon, style, ...props }) => {
  const base = { display:'inline-flex',alignItems:'center',gap:'8px',fontFamily:'var(--font-body)',fontWeight:600,cursor:disabled||loading?'not-allowed':'pointer',border:'1.5px solid transparent',borderRadius:'var(--radius)',transition:'var(--transition)',opacity:disabled||loading?0.6:1,whiteSpace:'nowrap' };
  const sizes = { sm:{padding:'6px 14px',fontSize:'13px'},md:{padding:'10px 20px',fontSize:'14px'},lg:{padding:'13px 28px',fontSize:'15px'} };
  const variants = { primary:{background:'var(--primary)',color:'#fff',borderColor:'var(--primary)'},secondary:{background:'var(--secondary)',color:'#fff',borderColor:'var(--secondary)'},outline:{background:'transparent',color:'var(--primary)',borderColor:'var(--primary)'},ghost:{background:'transparent',color:'var(--gray-600)',borderColor:'transparent'},danger:{background:'#dc2626',color:'#fff',borderColor:'#dc2626'},success:{background:'var(--success)',color:'#fff',borderColor:'var(--success)'} };
  return <button style={{...base,...sizes[size],...variants[variant],...style}} disabled={disabled||loading} {...props}>{loading?<span style={{width:14,height:14,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/>:icon}{children}</button>;
};

export const Input = ({ label, error, required, style, containerStyle, ...props }) => (
  <div style={{display:'flex',flexDirection:'column',gap:'5px',...containerStyle}}>
    {label&&<label style={{fontSize:'13px',fontWeight:600,color:'var(--gray-600)',letterSpacing:'0.02em'}}>{label}{required&&<span style={{color:'var(--primary)',marginLeft:3}}>*</span>}</label>}
    <input style={{padding:'9px 13px',borderRadius:'var(--radius)',border:`1.5px solid ${error?'#dc2626':'var(--gray-200)'}`,fontSize:'14px',color:'var(--gray-800)',background:'#fff',transition:'var(--transition)',outline:'none',...style}} {...props}/>
    {error&&<span style={{fontSize:'12px',color:'#dc2626'}}>{error}</span>}
  </div>
);

export const Select = ({ label, error, required, children, containerStyle, ...props }) => (
  <div style={{display:'flex',flexDirection:'column',gap:'5px',...containerStyle}}>
    {label&&<label style={{fontSize:'13px',fontWeight:600,color:'var(--gray-600)'}}>{label}{required&&<span style={{color:'var(--primary)',marginLeft:3}}>*</span>}</label>}
    <select style={{padding:'9px 13px',borderRadius:'var(--radius)',border:`1.5px solid ${error?'#dc2626':'var(--gray-200)'}`,fontSize:'14px',color:'var(--gray-800)',background:'#fff',cursor:'pointer',outline:'none'}} {...props}>{children}</select>
    {error&&<span style={{fontSize:'12px',color:'#dc2626'}}>{error}</span>}
  </div>
);

export const Textarea = ({ label, error, required, rows=4, containerStyle, ...props }) => (
  <div style={{display:'flex',flexDirection:'column',gap:'5px',...containerStyle}}>
    {label&&<label style={{fontSize:'13px',fontWeight:600,color:'var(--gray-600)'}}>{label}{required&&<span style={{color:'var(--primary)',marginLeft:3}}>*</span>}</label>}
    <textarea rows={rows} style={{padding:'9px 13px',borderRadius:'var(--radius)',border:`1.5px solid ${error?'#dc2626':'var(--gray-200)'}`,fontSize:'14px',color:'var(--gray-800)',background:'#fff',resize:'vertical',outline:'none'}} {...props}/>
    {error&&<span style={{fontSize:'12px',color:'#dc2626'}}>{error}</span>}
  </div>
);

export const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{background:'#fff',borderRadius:'var(--radius-lg)',border:'1px solid var(--gray-200)',boxShadow:'var(--shadow-sm)',overflow:'hidden',cursor:onClick?'pointer':'default',...style}}>{children}</div>
);

export const Badge = ({ children, color='gray' }) => {
  const colors = {gray:{bg:'var(--gray-100)',text:'var(--gray-600)'},green:{bg:'var(--success-light)',text:'var(--success)'},red:{bg:'var(--primary-light)',text:'var(--primary)'},blue:{bg:'var(--secondary-light)',text:'var(--secondary)'},yellow:{bg:'var(--warning-light)',text:'var(--warning)'},gold:{bg:'#FFF8E6',text:'#7A5200'}};
  const c=colors[color]||colors.gray;
  return <span style={{display:'inline-block',padding:'2px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:600,background:c.bg,color:c.text}}>{children}</span>;
};

export const Modal = ({ open, onClose, title, children, maxWidth=560 }) => {
  if(!open) return null;
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'var(--radius-lg)',maxWidth,width:'100%',maxHeight:'90vh',overflowY:'auto',boxShadow:'var(--shadow-lg)',animation:'fadeIn 0.2s ease'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:'1px solid var(--gray-200)'}}>
          <h3 style={{fontFamily:'var(--font-body)',fontWeight:700,fontSize:'16px'}}>{title}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:'22px',cursor:'pointer',color:'var(--gray-400)',lineHeight:1}}>×</button>
        </div>
        <div style={{padding:'24px'}}>{children}</div>
      </div>
    </div>
  );
};

export const Alert = ({ type='info', message, onClose }) => {
  const types = {success:{bg:'var(--success-light)',border:'var(--success)',color:'var(--success)',icon:'✓'},error:{bg:'var(--primary-light)',border:'var(--primary)',color:'var(--primary)',icon:'✕'},warning:{bg:'var(--warning-light)',border:'#C8A84B',color:'var(--warning)',icon:'⚠'},info:{bg:'var(--secondary-light)',border:'var(--secondary)',color:'var(--secondary)',icon:'ℹ'}};
  const t=types[type];
  return <div style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 16px',borderRadius:'var(--radius)',background:t.bg,border:`1.5px solid ${t.border}`,color:t.color,fontSize:'14px'}}><span style={{fontWeight:700,flexShrink:0}}>{t.icon}</span><span style={{flex:1}}>{message}</span>{onClose&&<button onClick={onClose} style={{background:'none',border:'none',color:'inherit',cursor:'pointer',fontWeight:700}}>×</button>}</div>;
};

export const Spinner = ({ size=40, color='var(--primary)' }) => (
  <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:40}}>
    <div style={{width:size,height:size,border:`3px solid var(--gray-200)`,borderTopColor:color,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
  </div>
);

export const Table = ({ headers, children }) => (
  <div style={{overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px'}}>
      <thead><tr style={{background:'var(--gray-50)',borderBottom:'2px solid var(--gray-200)'}}>
        {headers.map((h,i)=><th key={i} style={{padding:'12px 16px',textAlign:'left',fontSize:'12px',fontWeight:700,color:'var(--gray-500)',letterSpacing:'0.06em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>)}
      </tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export const Tr = ({ children, onClick }) => (
  <tr onClick={onClick} style={{borderBottom:'1px solid var(--gray-100)',cursor:onClick?'pointer':'default'}}
    onMouseEnter={e=>{if(onClick)e.currentTarget.style.background='var(--gray-50)'}}
    onMouseLeave={e=>{e.currentTarget.style.background=''}}>
    {children}
  </tr>
);
export const Td = ({ children, style }) => <td style={{padding:'12px 16px',color:'var(--gray-700)',verticalAlign:'middle',...style}}>{children}</td>;

export const StatCard = ({ title, value, icon, color='var(--primary)', subtitle }) => (
  <Card style={{padding:'24px'}}>
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
      <div>
        <p style={{fontSize:'13px',color:'var(--gray-500)',fontWeight:500,marginBottom:8}}>{title}</p>
        <p style={{fontSize:'32px',fontFamily:'var(--font-display)',color,lineHeight:1.1}}>{value}</p>
        {subtitle&&<p style={{fontSize:'12px',color:'var(--gray-400)',marginTop:4}}>{subtitle}</p>}
      </div>
      <div style={{width:44,height:44,borderRadius:10,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>{icon}</div>
    </div>
  </Card>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:12}}>
    <div>
      <h1 style={{fontSize:'26px',color:'var(--gray-900)',marginBottom:4}}>{title}</h1>
      {subtitle&&<p style={{color:'var(--gray-500)',fontSize:'14px'}}>{subtitle}</p>}
    </div>
    {action}
  </div>
);
