export async function interceptLinks(targets = [document], router){
  if(!Array.isArray(targets) || targets.length === 0) return false;
  targets.forEach(target => {
    target.addEventListener("click", async (e)=>{
      e.preventDefault();
      const link = e.target.closest("a[data-link][href]");
      if(!link || !router) return;
      await router.navigate(link.href);
    })
  })
}